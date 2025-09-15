// models/student.js
const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: String, required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null }
});

// Export safely
module.exports = mongoose.models.Student || mongoose.model("Student", StudentSchema);
