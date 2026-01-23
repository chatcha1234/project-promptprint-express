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
    const products = await Product.find().populate("items");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// ===== ADMIN ROUTES (ต้อง Login + เป็น Admin) =====

// Get all products (Admin)
router.get("/admin/products", auth, admin, async (req, res) => {
  try {
    const products = await Product.find().populate("items");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// Create Product (Admin)
// รองรับทั้ง field เก่า (price, tag) และ field ใหม่ (basePrice, category)
router.post(
  "/admin/products",
  auth,
  admin,
  upload.single("image"),
  async (req, res) => {
    try {
      // รองรับ field จาก Frontend (price, tag) และ Backend (basePrice, category)
      const { name, description } = req.body;
      const category = req.body.category || req.body.tag || "General";
      const basePrice = req.body.basePrice || req.body.price || 0;

      let imageUrl = "";

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "promptprint-products",
          format: "webp",
        });
        imageUrl = result.secure_url;
        removeFile(req.file.path);
      }

      const product = new Product({
        name,
        description,
        category,
        basePrice: Number(basePrice),
        imageUrl,
      });
      await product.save();
      res.status(201).json(product);
    } catch (error) {
      console.error("Create Product Error:", error);
      res.status(500).json({ error: "Error creating product" });
    }
  },
);

// Update Product (Admin)
router.put(
  "/admin/products/:id",
  auth,
  admin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const category = req.body.category || req.body.tag;
      const basePrice = req.body.basePrice || req.body.price;

      const updateData = { name, description };
      if (category) updateData.category = category;
      if (basePrice) updateData.basePrice = Number(basePrice);

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "promptprint-products",
          format: "webp",
        });
        updateData.imageUrl = result.secure_url;
        removeFile(req.file.path);
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
        },
      );
      res.json(product);
    } catch (error) {
      console.error("Update Product Error:", error);
      res.status(500).json({ error: "Error updating product" });
    }
  },
);

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
router.post("/api/upload", auth, upload.single("image"), async (req, res) => {
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
