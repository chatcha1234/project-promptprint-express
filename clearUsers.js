require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const clearUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected for Clearing Users");

    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users.`);
    console.log("All user accounts cleared!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error clearing users:", error);
    process.exit(1);
  }
};

clearUsers();
