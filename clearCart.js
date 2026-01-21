require("dotenv").config();
const mongoose = require("mongoose");

const Cart = require("./models/Cart");

async function clearCarts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    const result = await Cart.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} carts`);

    await mongoose.disconnect();
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

clearCarts();
