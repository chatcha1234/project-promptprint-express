const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;
const upload = require("../middleware/upload");
const fs = require("fs");
const { auth, admin } = require("../middleware/auth");

// Helper to remove files
const removeFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting file:", err);
  });
};

// ===== PUBLIC ROUTES =====

// Get Products (Public - ไม่ต้อง Login)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// ===== ADMIN ROUTES (ต้อง Login + เป็น Admin) =====

// Get all products (Admin)
router.get("/admin/products", auth, admin, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// Create Product (Admin)
router.post("/admin/products", auth, admin, async (req, res) => {
  try {
    const { name, description, imageUrl, price, tag } = req.body;
    // Map input to match Schema exactly
    // Schema expects: name, description, price, imageUrl, tag
    const product = new Product({
      name,
      description,
      price: Number(price), // Use 'price' directly, matches Schema
      imageUrl,
      tag: tag || "New", // Use 'tag' directly, matches Schema
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error("Create Product Error:", error);
    // Return detailed error for debugging if possible, or just generic 500
    res
      .status(500)
      .json({ error: "Error creating product", details: error.message });
  }
});

// Update Product (Admin)
router.put("/admin/products/:id", auth, admin, async (req, res) => {
  try {
    const { name, description, imageUrl, price, tag } = req.body;

    const updateData = {
      name,
      description,
    };

    if (price !== undefined) updateData.price = Number(price);
    if (tag !== undefined) updateData.tag = tag;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(product);
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ error: "Error updating product" });
  }
});

// Delete Product (Admin)
router.delete("/admin/products/:id", auth, admin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting product" });
  }
});

// ===== UPLOAD ROUTE (ต้อง Login) =====

// Standalone Image Upload Route
router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "promptprint-products",
      format: "webp",
    });
    removeFile(req.file.path);

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

module.exports = router;
