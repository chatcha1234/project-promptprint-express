const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;
const upload = require("../middleware/upload");
const fs = require("fs");

// Helper to remove files
const removeFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting file:", err);
  });
};

// 3. Get Products (Public)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().populate("items");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// 4. Products Management (Admin)
// Get all products (Admin)
// Note: This duplicates public get products but logic is same.
router.get("/admin/products", async (req, res) => {
  try {
    const products = await Product.find().populate("items");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// Create Product
router.post("/admin/products", upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, basePrice } = req.body;
    let imageUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
      removeFile(req.file.path);
    }

    const product = new Product({
      name,
      description,
      category,
      basePrice,
      imageUrl,
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating product" });
  }
});

// Update Product
router.put("/admin/products/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, basePrice } = req.body;
    const updateData = { name, description, category, basePrice };

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      updateData.imageUrl = result.secure_url;
      removeFile(req.file.path);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Error updating product" });
  }
});

// Delete Product
router.delete("/admin/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting product" });
  }
});

// Standalone Image Upload Route (Generic upload)
// Keeping it here as it was near products usually.
router.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "promptprint-products",
      format: "webp",
    });
    // Remove local file
    removeFile(req.file.path);

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

module.exports = router;
