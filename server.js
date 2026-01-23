const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware ควบคุมปริมาณ
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Config Logs
console.log("--- Server Config Check ---");
console.log(
  `- Cloudinary: ${
    process.env.CLOUDINARY_CLOUD_NAME ? "✅ Configured" : "❌ Missing"
  }`,
);
console.log(
  `- Gemini AI: ${process.env.GEMINI_API_KEY ? "✅ Configured" : "❌ Missing"}`,
);
console.log("---------------------------");

// --- Import Routes ---
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const aiRoutes = require("./routes/ai");
const statsRoutes = require("./routes/stats");

// --- Mount Routes ---
app.use("/api", authRoutes); // /api/register, /api/login
app.use("/api", aiRoutes); // /api/generate-design, /api/remove-background
app.use("/api/cart", cartRoutes); // /api/cart...
app.use("/api/users", userRoutes); // /api/users...
app.use("/admin", statsRoutes); // /admin/stats...
app.use("/", productRoutes); // /products, /admin/products (has full paths)
app.use("/", orderRoutes); // /api/orders, /orders/:userId (has full paths)

// Health Check
app.get("/", (req, res) => {
  res.send("PromptPrint API is running");
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
