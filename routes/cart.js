const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const cloudinary = require("cloudinary").v2;

// Get user's cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate(
      "items.productId",
    );
    if (!cart) {
      return res.json({ userId: req.params.userId, items: [] });
    }
    res.json(cart);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Add item to cart (regular product)
router.post("/", async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.productId && item.productId.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
    );
    res.json(populatedCart);
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// Add custom AI-generated product to cart
router.post("/custom", async (req, res) => {
  try {
    const { userId, customProduct, quantity = 1 } = req.body;

    if (!userId || !customProduct) {
      return res
        .status(400)
        .json({ error: "userId and customProduct are required" });
    }

    // Upload image to Cloudinary if it's a Data URL
    let imageUrl = customProduct.imageUrl;
    if (imageUrl && imageUrl.startsWith("data:")) {
      console.log("☁️ Uploading custom design to Cloudinary...");
      try {
        const uploadResult = await cloudinary.uploader.upload(imageUrl, {
          folder: "promptprint-cart-designs",
          format: "webp",
        });
        imageUrl = uploadResult.secure_url;
        console.log("✅ Uploaded to Cloudinary:", imageUrl);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload failed:", uploadError);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Add custom product with Cloudinary URL
    cart.items.push({
      customProduct: {
        name: customProduct.name,
        description: customProduct.description,
        price: customProduct.price,
        imageUrl: imageUrl, // Now a Cloudinary URL, not Data URL
        isCustom: true,
      },
      quantity,
    });

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error("Add Custom to Cart Error:", error);
    res.status(500).json({ error: "Failed to add custom item to cart" });
  }
});

// Update cart item quantity
router.put("/", async (req, res) => {
  try {
    const { userId, productId, itemId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Find item by productId or itemId
    const item = cart.items.find((item) => {
      if (itemId) return item._id.toString() === itemId;
      if (productId && item.productId)
        return item.productId.toString() === productId;
      return false;
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    item.quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
    );
    res.json(populatedCart);
  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// Remove item from cart
router.delete("/:userId/:itemId", async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.productId",
    );
    res.json(populatedCart);
  } catch (error) {
    console.error("Remove from Cart Error:", error);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

// Clear entire cart (after checkout)
router.delete("/:userId/clear", async (req, res) => {
  try {
    const { userId } = req.params;
    await Cart.findOneAndDelete({ userId });
    res.json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

module.exports = router;
