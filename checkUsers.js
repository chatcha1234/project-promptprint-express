require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    const users = await User.find({});
    console.log(`Found ${users.length} users in database:`);
    users.forEach((u) => {
      console.log(
        `- Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`
      );
    });

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkUsers();
