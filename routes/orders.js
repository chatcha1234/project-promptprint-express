const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "payment_slips",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage: storage });

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

// Update order status
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

// Upload Payment Slip
router.post(
  "/api/orders/:id/payment",
  upload.single("slip"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
          paymentSlipUrl: req.file.path,
          paymentStatus: "Pending", // Admin to verify
          status: "Payment Verification",
        },
        { new: true },
      );

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      console.log(`✅ Payment Slip Uploaded for Order ${order._id}`);
      res.json(order);
    } catch (error) {
      console.error("Upload Slip Error:", error);
      res.status(500).json({ error: "Failed to upload payment slip" });
    }
  },
);

module.exports = router;
