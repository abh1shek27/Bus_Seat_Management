// models/route.js
const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true }
});

// Export safely
module.exports = mongoose.models.Route || mongoose.model("Route", RouteSchema);
