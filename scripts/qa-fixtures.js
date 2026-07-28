require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user");
const Cart = require("../models/cart");
const Wishlist = require("../models/wishlist");
const Wallet = require("../models/wallet");
const Address = require("../models/address");
const Order = require("../models/order");
const Variant = require("../models/variant");

const mongoUri = process.env.MONGO_URI || process.env.MongoDB_url;

const fixtures = [
  {
    userId: "qa_customer_2026",
    username: "ARNI QA Customer",
    email: "qa.customer@arni.test",
    phone: "9000000001",
    password: "ArniQA@2026",
    role: "User",
    gender: "Other",
    profileImage: "/images/avatars/avatar-1.svg",
  },
  {
    userId: "qa_admin_2026",
    username: "ARNI QA Admin",
    email: "qa.admin@arni.test",
    phone: "9000000002",
    password: "ArniAdminQA@2026",
    role: "Admin",
    gender: "Other",
    profileImage: "/images/avatars/avatar-8.svg",
  },
];

async function upsertUser(fixture) {
  let user = await User.findOne({ email: fixture.email });

  if (!user) {
    user = new User(fixture);
  } else {
    Object.assign(user, fixture);
  }

  user.status = "Active";
  await user.save();
  return user;
}

async function ensureCustomerData(user) {
  const previousOrders = await Order.find({ userId: user.userId }).lean();

  // Restore only inventory consumed by this clearly tagged synthetic account.
  for (const order of previousOrders) {
    if (order.variant && order.size && order.quantity > 0) {
      await Variant.updateOne(
        { _id: order.variant },
        { $inc: { [`sizes.${order.size}`]: order.quantity } },
      );
    }
  }

  await Order.deleteMany({ userId: user.userId });

  await Promise.all([
    Cart.findOneAndUpdate(
      { user: user._id },
      { $set: { user: user._id, items: [], couponApplied: null } },
      { upsert: true, new: true },
    ),
    Wishlist.findOneAndUpdate(
      { user: user._id },
      { $set: { user: user._id, items: [] } },
      { upsert: true, new: true },
    ),
    Wallet.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          user: user._id,
          balance: 5000,
          transactions: [],
        },
      },
      { upsert: true, new: true },
    ),
    Address.deleteMany({
      userId: user._id,
      postalCode: { $ne: "682001" },
    }),
    Address.findOneAndUpdate(
      { userId: user._id, postalCode: "682001" },
      {
        $set: {
          userId: user._id,
          name: "ARNI QA Customer",
          phone: "9000000001",
          street: "QA House, Marine Drive",
          city: "Kochi",
          state: "Kerala",
          postalCode: "682001",
          country: "India",
          isPrimary: true,
        },
      },
      { upsert: true, new: true },
    ),
  ]);
}

async function main() {
  if (!mongoUri) {
    throw new Error("MONGO_URI is required to create QA fixtures.");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });

  for (const fixture of fixtures) {
    const user = await upsertUser(fixture);
    if (fixture.role === "User") {
      await ensureCustomerData(user);
    }
    console.log(`QA fixture ready: ${fixture.role} ${fixture.email}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`QA fixture setup failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
