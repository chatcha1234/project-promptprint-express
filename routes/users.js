const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, admin } = require("../middleware/auth");

// Get all users (Admin Only)
// ต้อง Login + เป็น Admin เท่านั้น
router.get("/", auth, admin, async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Delete user (Admin Only)
// ต้อง Login + เป็น Admin เท่านั้น
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
});

module.exports = router;
