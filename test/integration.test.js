const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const User = require("../models/user");
const Variant = require("../models/variant");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Wallet = require("../models/wallet");
const Order = require("../models/order");
const Coupon = require("../models/coupon");

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
let testOrderId;
let testVariant;
let testSize;
let qaUser;

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

before(async () => {
  await waitForDatabase();
  qaUser = await User.findOne({ email: "qa.customer@arni.test" });
  assert.ok(qaUser, "Run npm run test:fixtures before integration tests.");

  const variants = await Variant.find({});
  for (const variant of variants) {
    const product = await Product.findOne({
      _id: variant.productId,
      status: "active",
    });
    const size = Object.entries(variant.sizes || {}).find(
      ([, stock]) => Number(stock) >= 3,
    )?.[0];
    if (product && size && product.discountPrice + 20 <= 5000) {
      testVariant = variant;
      testSize = size;
      break;
    }
  }
  assert.ok(testVariant && testSize, "A purchasable QA product is required.");
});
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

  test("redirects an empty checkout to the cart", async () => {
    const response = await customer.get("/users/checkout");
    assert.equal(response.status, 302);
    assert.equal(response.headers.location, "/users/cart");
  });

  test("returns the QA wallet balance", async () => {
    const response = await customer.get("/users/wallet/balance");
    assert.equal(response.status, 200);
    assert.equal(typeof response.body.balance, "number");
  });

  test("validates cart status requests without changing the cart", async () => {
    const response = await customer
      .get("/users/cart/status")
      .set("Accept", "application/json")
      .query({ variantId: "not-an-object-id", size: "M" });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /valid product option/i);
  });

  test("adds, validates, updates, and displays a cart item", async () => {
    const invalid = await customer.post("/users/cart/add").send({
      variantId: testVariant._id,
      selectedSize: testSize,
      quantity: 0,
    });
    assert.equal(invalid.status, 400);

    const add = await customer.post("/users/cart/add").send({
      variantId: testVariant._id,
      selectedSize: testSize,
      quantity: 1,
    });
    assert.equal(add.status, 200);
    assert.equal(add.body.success, true);

    const duplicate = await customer.post("/users/cart/add").send({
      variantId: testVariant._id,
      selectedSize: testSize,
      quantity: 1,
    });
    assert.equal(duplicate.status, 409);

    const update = await customer.post("/users/cart/update-quantity").send({
      variantId: testVariant._id,
      size2: testSize,
      quantity: 2,
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.quantity, 2);

    const tooMany = await customer.post("/users/cart/update-quantity").send({
      variantId: testVariant._id,
      size2: testSize,
      quantity: Number(testVariant.sizes[testSize]) + 1,
    });
    assert.equal(tooMany.status, 400);

    const checkout = await customer.get("/users/checkout");
    assert.equal(checkout.status, 200);
    assert.match(checkout.text, /Shipping Address/);
  });

  test("adds, checks, and removes a wishlist item", async () => {
    const add = await customer.post("/users/wishlist/toggle").send({
      variantId: testVariant._id,
      size: testSize,
      action: "add",
    });
    assert.equal(add.status, 200);
    assert.equal(add.body.success, true);

    const check = await customer.get(
      `/users/wishlist/check/${testVariant._id}`,
    );
    assert.equal(check.status, 200);
    assert.equal(check.body.isInWishlist, true);

    const remove = await customer.delete(
      `/users/wishlist/item/${testVariant._id}`,
    );
    assert.equal(remove.status, 200);
  });

  test("validates profile updates and preserves the QA identity", async () => {
    const invalid = await customer
      .post("/users/pI/update")
      .send({ username: "x" });
    assert.equal(invalid.status, 400);
    assert.match(invalid.body.error, /between 3 and 30/);

    const valid = await customer
      .post("/users/pI/update")
      .send({ username: "ARNI QA Customer" });
    assert.equal(valid.status, 200);
    assert.equal(valid.body.success, true);
  });

  test("creates, updates, promotes, and deletes an address", async () => {
    const create = await customer.post("/users/adr/addresses").send({
      street: "QA Integration Address",
      city: "Kochi",
      state: "Kerala",
      postalCode: "682002",
      country: "India",
    });
    assert.equal(create.status, 201);
    const addressId = create.body.address._id;

    const update = await customer
      .put(`/users/adr/addresses/${addressId}`)
      .send({
        street: "QA Integration Address Updated",
        city: "Kochi",
        state: "Kerala",
        postalCode: "682003",
        country: "India",
      });
    assert.equal(update.status, 200);
    assert.equal(update.body.address.postalCode, "682003");

    const primary = await customer.patch(
      `/users/adr/addresses/${addressId}/primary`,
    );
    assert.equal(primary.status, 200);

    const remove = await customer.delete(`/users/adr/addresses/${addressId}`);
    assert.equal(remove.status, 200);
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

  test("places and safely cancels a paid wallet order", async () => {
    await customer.post("/users/cart/update-quantity").send({
      variantId: testVariant._id,
      size2: testSize,
      quantity: 1,
    });
    const addresses = await customer.get("/users/checkout/addresses");
    const addressId = addresses.body.find((address) => address.isPrimary)?._id;
    assert.ok(addressId);

    const walletBefore = await Wallet.findOne({ user: qaUser._id });
    const stockBefore = Number(
      (await Variant.findById(testVariant._id)).sizes[testSize],
    );
    const payment = await customer.post("/users/checkout/wallet/pay").send({
      shippingAddressId: addressId,
    });
    assert.equal(payment.status, 200);
    assert.equal(payment.body.success, true);
    testOrderId = payment.body.orders[0];

    const emptyReason = await customer
      .post(`/users/orderOverview/${testOrderId}/cancel`)
      .send({ reason: "" });
    assert.equal(emptyReason.status, 400);

    const cancel = await customer
      .post(`/users/orderOverview/${testOrderId}/cancel`)
      .send({ reason: "QA cancellation verification" });
    assert.equal(cancel.status, 200);
    assert.equal(cancel.body.success, true);

    const [walletAfter, variantAfter, orderAfter] = await Promise.all([
      Wallet.findOne({ user: qaUser._id }),
      Variant.findById(testVariant._id),
      Order.findById(testOrderId),
    ]);
    assert.equal(walletAfter.balance, walletBefore.balance);
    assert.equal(Number(variantAfter.sizes[testSize]), stockBefore);
    assert.equal(orderAfter.status, "Cancelled");
    assert.equal(orderAfter.paymentStatus, "Refunded");
    assert.equal(orderAfter.cancellationReason, "QA cancellation verification");

    const checkout = await customer.get("/users/checkout");
    assert.equal(checkout.status, 302);
    assert.equal(checkout.headers.location, "/users/cart");
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

    const protectedJson = await customer
      .get("/users/cart/status")
      .set("Accept", "application/json")
      .query({
        variantId: new mongoose.Types.ObjectId().toString(),
        size: "M",
      });
    assert.equal(protectedJson.status, 401);
    assert.equal(protectedJson.body.code, "AUTHENTICATION_REQUIRED");
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

  for (const route of [
    "/admin/dashboard/stats",
    "/admin/dashboard/sales-chart?timeframe=month",
    "/admin/dashboard/top-categories",
    "/admin/orders/get",
    "/admin/coupons/get",
    "/admin/banner/banners",
    "/admin/sales/daily",
    "/admin/sales/monthly",
    "/admin/sales/yearly",
  ]) {
    test(`authenticated API GET ${route}`, async () => {
      const response = await admin.get(route);
      assert.equal(response.status, 200);
      assert.match(response.headers["content-type"], /application\/json/);
    });
  }

  test("rejects illegal order status transitions", async () => {
    assert.ok(testOrderId);
    const response = await admin
      .put(`/admin/orders/${testOrderId}/status`)
      .send({ status: "Delivered" });
    assert.equal(response.status, 400);
    assert.match(response.body.message, /cannot move/);
  });

  test("creates, updates, reads, and deletes a QA coupon", async () => {
    await Coupon.deleteMany({ couponCode: "QAINTEGRATION100" });
    const create = await admin.post("/admin/coupons/add").send({
      couponName: "QA Integration Coupon",
      couponCode: "QAINTEGRATION100",
      discount: 100,
      minAmount: 500,
      validity: "2027-09-01",
    });
    assert.equal(create.status, 201);
    const couponId = create.body.coupon._id;

    const duplicate = await admin.post("/admin/coupons/add").send({
      couponName: "Duplicate",
      couponCode: "QAINTEGRATION100",
      discount: 100,
      minAmount: 500,
      validity: "2027-09-01",
    });
    assert.equal(duplicate.status, 400);

    const update = await admin.patch(`/admin/coupons/${couponId}`).send({
      couponName: "QA Integration Coupon Updated",
      couponCode: "QAINTEGRATION100",
      discount: 120,
      minAmount: 500,
      validity: "2027-10-01",
    });
    assert.equal(update.status, 200);

    const read = await admin.get(`/admin/coupons/${couponId}`);
    assert.equal(read.status, 200);
    assert.equal(read.body.coupon.discount, 120);

    const remove = await admin.delete(`/admin/coupons/${couponId}`);
    assert.equal(remove.status, 200);
  });

  test("blocks and restores the QA customer", async () => {
    const block = await admin.post("/admin/users/block").send({
      id: qaUser._id,
      blockReason: "QA integration verification",
    });
    assert.equal(block.status, 200);

    const unblock = await admin.post("/admin/users/unblock-user").send({
      id: qaUser._id,
    });
    assert.equal(unblock.status, 200);
    assert.equal((await User.findById(qaUser._id)).status, "Active");
  });

  test("logs out and protects administrator pages", async () => {
    const logout = await admin.post("/admin/logout");
    assert.equal(logout.status, 200);
    assert.equal(logout.body.success, true);

    const protectedPage = await admin.get("/admin/dashboard");
    assert.equal(protectedPage.status, 302);
    assert.equal(protectedPage.headers.location, "/auth/login");
  });
});
