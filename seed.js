require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const seedData = [
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
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected for Seeding");

    // Clear existing data to avoid duplicates (Optional: remove if you want to keep adding)
    await Product.deleteMany({});
    console.log("Cleared existing products");

    await Product.insertMany(seedData);
    console.log("Seeded products successfully!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();
