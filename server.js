const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const axios = require("axios"); // Import axios
require("dotenv").config();

// Helper to remove files
const removeFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting file:", err);
  });
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Models
const User = require("./models/User");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Design = require("./models/Design");

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Config Logs
console.log("--- Server Config Check ---");
console.log("Cloudinary Config:");
console.log(
  `- Cloud Name: ${
    process.env.CLOUDINARY_CLOUD_NAME ? "✅ Found" : "❌ Missing"
  }`,
);
console.log(
  `- API Key: ${process.env.CLOUDINARY_API_KEY ? "✅ Found" : "❌ Missing"}`,
);
console.log(
  `- API Secret: ${
    process.env.CLOUDINARY_API_SECRET ? "✅ Found" : "❌ Missing"
  }`,
);
console.log("Gemini AI Config:");
console.log(
  `- API Key: ${process.env.GEMINI_API_KEY ? "✅ Found" : "❌ Missing"}`,
);
console.log("---------------------------");

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// --- Routes ---

// 1. Register
app.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, email });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
});

// 2. Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    res.json({
      token,
      username: user.username,
      role: user.role,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
});

// 3. Get Products (Public)
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().populate("items");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// 4. Products Management (Admin)
// Get all products (Admin)
app.get("/admin/products", async (req, res) => {
  try {
    const products = await Product.find().populate("items");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

// Create Product
app.post("/admin/products", upload.single("image"), async (req, res) => {
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

// Standalone Image Upload Route
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "promptprint-products",
      format: "webp",
    });
    // Remove local file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error("Error deleting local file:", err);
    }

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

// Update Product
app.put("/admin/products/:id", upload.single("image"), async (req, res) => {
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
app.delete("/admin/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting product" });
  }
});

// 5. Order Routes
app.post("/orders", async (req, res) => {
  try {
    const { userId, items, totalAmount, shippingAddress } = req.body;
    const order = new Order({
      userId,
      items,
      totalAmount,
      shippingAddress,
      status: "pending",
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 6. Admin Dashboard Stats & Orders
app.get("/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOrders = await Order.countDocuments();
    const productsCount = await Product.countDocuments();
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    res.json({ totalUsers, totalOrders, totalRevenue, productsCount });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/admin/orders", async (req, res) => {
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

app.put("/admin/orders/:id/status", async (req, res) => {
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

// 8. User Management (Admin)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
});

console.log("Gemini AI Config:");
console.log(
  `- API Key: ${process.env.GEMINI_API_KEY ? "✅ Found" : "❌ Missing"}`,
);
console.log("Remove.bg Config:");
console.log(
  `- API Key: ${process.env.REMOVE_BG_API_KEY ? "✅ Found" : "❌ Missing"}`,
);
console.log("---------------------------");

// 7. AI Design Generation Route
app.post("/api/generate-design", async (req, res) => {
  try {
    const { prompt, style, removeBackground } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("-----------------------------------------");
    console.log("🎨 Received Prompt:", prompt);
    if (style) console.log("🎨 Desired Style:", style);
    console.log("✂️ Remove Background Requested:", removeBackground);
    console.log(
      "🔑 Remove.bg Key Status:",
      process.env.REMOVE_BG_API_KEY ? "AVAILABLE" : "MISSING",
    );
    console.log("-----------------------------------------");

    let enhancedPrompt = prompt;

    // 1. Enhance prompt with Gemini
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        console.log("🤖 Asking Gemini to enhance prompt...");
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`;

        // Strong instruction for background removal
        let bgInstruction = "";
        if (removeBackground) {
          bgInstruction =
            'CRITICAL INSTRUCTION: The image MUST have a CLEAN WHITE BACKGROUND. No scenery, no landscape, no complex background elements. The subject must be ISOLATED (die-cut style). Use keywords: "white background", "simple background", "minimalist", "vector", "sticker".';
        }

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `As an AI art prompt generator, please rewrite the following description into a detailed, creative, and high-quality image generation prompt in English, suitable for a T-shirt design. Focus on visual details, style, and mood. Keep it under 50 words. The description is: "${prompt}". The desired art style is: "${
                      style || "Realistic"
                    }". ${bgInstruction} Force the prompt to start with "A sticker of..." or "A vector design of..." if background removal is requested.`,
                  },
                ],
              },
            ],
          }),
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          enhancedPrompt = text.trim();
          console.log("✨ Enhanced Prompt:", enhancedPrompt);
        }
      } catch (geminiError) {
        console.error("⚠️ Gemini Enhancement Failed:", geminiError.message);
      }
    } else {
      console.log("⏩ Skipping enhancement (No Key)");
    }

    // 2. Generate Image URL using Pollinations.ai
    // Add 'minimalist' and 'white background' to the final URL seed/params just in case
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

    console.log("✅ Generated Pollinations URL:", pollinationsUrl);

    // 3. Upload to Cloudinary
    console.log("☁️ Uploading to Cloudinary...");
    // 3. Upload to Cloudinary
    console.log("☁️ Uploading to Cloudinary...");
    const uploadResult = await cloudinary.uploader.upload(pollinationsUrl, {
      folder: "promptprint-designs",
      format: "webp",
    });

    // 4. Save to MongoDB
    const { userId } = req.body;
    let newDesign = null;

    // Validate userId before usage
    let validUserId = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      validUserId = userId;
    } else if (userId) {
      console.warn(
        `⚠️ Invalid userId received: ${userId}. Saving design without user association.`,
      );
    }

    if (validUserId) {
      newDesign = await Design.create({
        userId: validUserId,
        prompt,
        enhancedPrompt,
        imageUrl: uploadResult.secure_url,
        style: "AI Generated",
      });
      console.log("💾 Design saved to DB:", newDesign._id);
    } else {
      // Option to save design without user if needed, or just skip saving to DB
      // For now, let's save it without userId if your schema allows it (it does, references are optional usually if not required: true)
      newDesign = await Design.create({
        prompt,
        enhancedPrompt,
        imageUrl: uploadResult.secure_url,
        style: "AI Generated",
      });
      console.log("💾 Design saved to DB (Anonymous):", newDesign._id);
    }

    res.json({
      imageUrl: uploadResult.secure_url,
      enhancedPrompt: enhancedPrompt,
      designId: newDesign ? newDesign._id : null,
    });
  } catch (error) {
    console.error("❌ AI Generation Error Details:");
    console.error("- Message:", error.message);
    if (error.response) {
      console.error("- Response Status:", error.response.status);
      console.error("- Response Data:", error.response.data);
    }
    console.error("- Stack:", error.stack);
    res.status(500).json({
      error: "Failed to generate design",
      details: error.message,
    });
  }
});

// 8. Manual Background Removal Route
app.post("/api/remove-background", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    if (!process.env.REMOVE_BG_API_KEY) {
      return res.status(500).json({ error: "Remove.bg API Key missing" });
    }

    console.log("✂️ Manual Background Removal Requested for:", imageUrl);

    // Call Remove.bg
    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      {
        image_url: imageUrl,
        size: "auto",
      },
      {
        headers: {
          "X-Api-Key": process.env.REMOVE_BG_API_KEY,
        },
        responseType: "arraybuffer",
      },
    );

    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    const transparencyDataUrl = `data:image/png;base64,${base64Image}`;

    // Upload to Cloudinary
    console.log("☁️ Uploading transparent image to Cloudinary...");
    const uploadResult = await cloudinary.uploader.upload(transparencyDataUrl, {
      folder: "promptprint-designs",
      format: "webp",
    });

    console.log("✅ Manual BG Removal Success:", uploadResult.secure_url);

    res.json({ transparentImageUrl: uploadResult.secure_url });
  } catch (error) {
    console.error(
      "❌ BG Removal Error:",
      error.response?.data || error.message,
    );
    res.status(500).json({ error: "Failed to remove background" });
  }
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
