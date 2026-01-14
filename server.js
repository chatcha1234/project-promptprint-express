require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");

// Middleware
app.use(cors());
app.use(express.json());

// Basic Test Route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// --- User Auth API ---
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Register failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user by Email OR Username (if email field contains a username)
    // Note: Frontend sends 'email' field, but user might type username there
    const user = await User.findOne({
      $or: [{ email: email }, { username: email }],
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      userId: user._id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// --- Product API ---
const Product = require("./models/Product");

// Get All Products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Seed Initial Products (Run once)
const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany([
        {
          name: "Classic White Tee",
          description: "Premium cotton t-shirt, perfect for custom AI designs.",
          price: 29.99,
          imageUrl:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          tag: "Best Seller",
        },
        {
          name: "Urban Hoodie",
          description: "Cozy and stylish hoodie for street look.",
          price: 59.99,
          imageUrl:
            "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          tag: "Winter",
        },
        {
          name: "Canvas Tote",
          description: "Eco-friendly tote bag with durable print area.",
          price: 19.99,
          imageUrl:
            "https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          tag: "Eco",
        },
        {
          name: "Ceramic Mug",
          description: "Classic 11oz mug for your morning coffee.",
          price: 14.99,
          imageUrl:
            "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          tag: "Home",
        },
      ]);
      console.log("Initial products seeded!");
    }
  } catch (error) {
    console.error("Seeding error:", error);
  }
};

// Initial Database Connection & Seeding
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    seedProducts();
  })
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Mock Route for AI Design
app.post("/api/generate-design", async (req, res) => {
  const { prompt, style } = req.body;
  console.log("Received prompt:", prompt);

  // Mock generation (replace with real AI later)
  const mockImageUrl =
    "https://images.unsplash.com/photo-1583336633292-2ec414d95204?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  const mockEnhanced = `Enhanced version of: ${prompt} - High quality, detailed, trending on artstation.`;

  try {
    // Save to Database
    const Design = require("./models/Design");
    const newDesign = await Design.create({
      prompt,
      enhancedPrompt: mockEnhanced,
      imageUrl: mockImageUrl,
      style: style || "General",
    });

    res.json({
      success: true,
      imageUrl: newDesign.imageUrl,
      enhancedPrompt: newDesign.enhancedPrompt,
      designId: newDesign._id,
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Failed to save design" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
