const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Create order
router.post("/api/orders", async (req, res) => {
  try {
    const { userId, customerDetails, items, totalAmount } = req.body;

    if (!userId || !items || !items.length) {
      return res.status(400).json({ error: "userId and items are required" });
    }

    const order = new Order({
      userId,
      customerDetails,
      items,
      totalAmount,
      status: "Pending",
    });

    await order.save();
    console.log("✅ Order created:", order._id);
    res.status(201).json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Get user orders (Public/User)
router.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Admin: Get all orders
router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Admin Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Admin: Update order status
router.put("/admin/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;
