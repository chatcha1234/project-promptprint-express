require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const setAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    const targetUsername = "admin"; // ชื่อ User ที่ต้องการตั้งเป็น Admin

    const user = await User.findOneAndUpdate(
      { username: targetUsername },
      { role: "admin" },
      { new: true } // ให้คืนค่าข้อมูลหลังอัปเดตแล้วกลับมา
    );

    if (user) {
      console.log(
        `✅ Success! User '${user.username}' is now an '${user.role}'.`
      );
    } else {
      console.log(`❌ User '${targetUsername}' not found.`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error setting admin:", error);
    process.exit(1);
  }
};

setAdmin();
