require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    // 1. Find User
    const username = "chatcha2800"; // Target user
    const user = await User.findOne({ username });

    if (!user) {
      console.log(`❌ User '${username}' NOT found in Database.`);
      console.log("Listing all users found:");
      const allUsers = await User.find();
      allUsers.forEach((u) => console.log(`- ${u.username} (${u.email})`));
      process.exit(0);
    }

    console.log(`✅ User '${username}' found.`);
    console.log(`🔑 Stored Hash: ${user.password}`);

    // 2. Test Password
    const testPass = "12345678"; // <--- The password you set when registering
    console.log(`❓ Testing password: '${testPass}'`);

    const isMatch = await bcrypt.compare(testPass, user.password);

    if (isMatch) {
      console.log("🎉 SUCCESS! Password matches.");
    } else {
      console.log("❌ FAILED! Password does NOT match.");

      // Double check if password acts like plain text (just in case)
      if (user.password === testPass) {
        console.log(
          "⚠️ WARNING: Stored password is PLAIN TEXT (not hashed). Please clear users and register again."
        );
      }
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

debugLogin();
