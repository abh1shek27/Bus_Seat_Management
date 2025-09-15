// models/seat.js
const mongoose = require("mongoose");

const SeatSchema = new mongoose.Schema({
  seatNumber: Number,
  isOccupied: { type: Boolean, default: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null }
});

// Export safely to avoid OverwriteModelError
module.exports = mongoose.models.Seat || mongoose.model("Seat", SeatSchema);
