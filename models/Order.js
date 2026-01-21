const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String, // Can be ObjectId or just a string if guest checkout allowed properly later
    required: true,
  },
  customerDetails: {
    name: String,
    email: String,
    address: String,
    city: String,
    zip: String,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      // For custom AI-generated products
      customProduct: {
        name: String,
        description: String,
        price: Number,
        imageUrl: String,
        isCustom: Boolean,
      },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Pending", // Pending, Processing, Shipped, Delivered, Cancelled
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", OrderSchema);
