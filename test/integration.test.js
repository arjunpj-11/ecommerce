const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.NODE_ENV = "test";
const app = require("../app");

const customerCredentials = {
  emailOrPhone: "qa.customer@arni.test",
  password: "ArniQA@2026",
};
const adminCredentials = {
  emailOrPhone: "qa.admin@arni.test",
  password: "ArniAdminQA@2026",
};

async function waitForDatabase() {
  if (mongoose.connection.readyState === 1) return;

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Database connection timed out.")),
      15000,
    );

    mongoose.connection.once("connected", () => {
      clearTimeout(timeout);
      resolve();
    });
    mongoose.connection.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function closeConnections() {
  if (app.locals.sessionStore?.close) {
    await app.locals.sessionStore.close();
  }
  await mongoose.disconnect();
}

before(waitForDatabase);
after(closeConnections);

describe("public storefront", { concurrency: false }, () => {
  for (const route of [
    "/",
    "/shop",
    "/search",
    "/auth/login",
    "/auth/signin",
    "/auth/forgetPassword",
    "/auth/terms",
    "/auth/privacy",
  ]) {
    test(`GET ${route}`, async () => {
      const response = await request(app).get(route);
      assert.equal(response.status, 200);
      assert.match(response.headers["content-type"], /text\/html/);
    });
  }

  test("unknown pages use the branded 404", async () => {
    const response = await request(app).get("/qa-page-that-does-not-exist");
    assert.equal(response.status, 404);
    assert.match(response.text, /This page has left the collection/);
  });

  test("password reset cannot be opened without OTP verification", async () => {
    const response = await request(app).get("/auth/resetPassword");
    assert.equal(response.status, 302);
    assert.equal(response.headers.location, "/auth/forgetPassword");
  });
});

describe("customer journey", { concurrency: false }, () => {
  const customer = request.agent(app);

  test("rejects an incorrect password", async () => {
    const response = await customer.post("/auth/login/loginAuth").send({
      ...customerCredentials,
      password: "WrongPassword@2026",
    });
    assert.equal(response.status, 200);
    assert.equal(response.text, "undone");
  });

  test("logs in the QA customer", async () => {
    const response = await customer
      .post("/auth/login/loginAuth")
      .send(customerCredentials);
    assert.equal(response.status, 200);
    assert.equal(response.text, "done");
  });

  for (const route of [
    "/users/cart",
    "/users/checkout",
    "/users/pI",
    "/users/adr",
    "/users/order",
    "/users/wishlist",
    "/users/wallet",
  ]) {
    test(`authenticated GET ${route}`, async () => {
      const response = await customer.get(route);
      assert.equal(response.status, 200);
      assert.match(response.headers["content-type"], /text\/html/);
    });
  }

  test("returns the QA wallet balance", async () => {
    const response = await customer.get("/users/wallet/balance");
    assert.equal(response.status, 200);
    assert.equal(typeof response.body.balance, "number");
  });

  test("does not expose or modify another address", async () => {
    const inaccessibleId = new mongoose.Types.ObjectId().toString();

    const update = await customer
      .patch(`/users/checkout/addresses/${inaccessibleId}`)
      .send({
        street: "Unauthorized change",
        city: "Kochi",
        state: "Kerala",
        postalCode: "682001",
        country: "India",
      });
    assert.equal(update.status, 404);

    const remove = await customer.delete(
      `/users/checkout/addresses/${inaccessibleId}`,
    );
    assert.equal(remove.status, 404);
  });

  test("rejects unverified paid orders and incomplete payment callbacks", async () => {
    const addresses = await customer.get("/users/checkout/addresses");
    assert.equal(addresses.status, 200);
    assert.ok(addresses.body[0]?._id);

    const directPaidOrder = await customer
      .post("/users/checkout/place-order")
      .send({
        paymentMethod: "wallet",
        shippingAddressId: addresses.body[0]._id,
      });
    assert.equal(directPaidOrder.status, 400);

    const incompleteVerification = await customer
      .post("/users/checkout/verify-payment")
      .send({ shippingAddressId: addresses.body[0]._id });
    assert.equal(incompleteVerification.status, 400);
  });

  test("keeps order details, invoices, and refunds scoped to the owner", async () => {
    const inaccessibleOrderId = new mongoose.Types.ObjectId().toString();

    const details = await customer.get(
      `/users/orderOverview/${inaccessibleOrderId}`,
    );
    assert.equal(details.status, 404);

    const invoice = await customer.get(
      `/users/orderOverview/${inaccessibleOrderId}/invoice`,
    );
    assert.equal(invoice.status, 404);

    const refund = await customer
      .post(`/users/orderOverview/${inaccessibleOrderId}/refund`)
      .send({ reason: "Unauthorized request" });
    assert.equal(refund.status, 404);
  });

  test("logs out and protects customer pages", async () => {
    const logout = await customer.post("/users/logout");
    assert.equal(logout.status, 302);
    assert.equal(logout.headers.location, "/auth/login");

    const protectedPage = await customer.get("/users/cart");
    assert.equal(protectedPage.status, 302);
    assert.equal(protectedPage.headers.location, "/auth/login");
  });
});

describe("administrator journey", { concurrency: false }, () => {
  const admin = request.agent(app);

  test("logs in the QA administrator", async () => {
    const response = await admin
      .post("/auth/login/loginAuth")
      .send(adminCredentials);
    assert.equal(response.status, 200);
    assert.equal(response.text, "admin");
  });

  for (const route of [
    "/admin/dashboard",
    "/admin/products",
    "/admin/variant",
    "/admin/maincategories",
    "/admin/subcategories",
    "/admin/orders",
    "/admin/coupons",
    "/admin/users",
    "/admin/sales",
    "/admin/banner",
  ]) {
    test(`authenticated GET ${route}`, async () => {
      const response = await admin.get(route);
      assert.equal(response.status, 200);
      assert.match(response.headers["content-type"], /text\/html/);
    });
  }

  test("logs out and protects administrator pages", async () => {
    const logout = await admin.post("/admin/logout");
    assert.equal(logout.status, 200);
    assert.equal(logout.body.success, true);

    const protectedPage = await admin.get("/admin/dashboard");
    assert.equal(protectedPage.status, 302);
    assert.equal(protectedPage.headers.location, "/auth/login");
  });
});
