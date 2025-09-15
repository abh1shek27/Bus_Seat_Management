// models/user.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Export safely
module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
