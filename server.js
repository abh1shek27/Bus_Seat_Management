const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Seat = require("./models/seat");
const Student = require("./models/student");
const Route = require("./models/route");
const User = require("./models/user");
const authRoutes = require("./routes/auth");
const auth = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/busapp")
.then(async () => {
  console.log("✅ MongoDB Connected");
  await initializeAdminUser();
  console.log("✅ Database initialization completed");
})
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
});

// Auth Routes
app.use("/auth", authRoutes);

// Protect APIs below
app.use("/api", auth);

// Initialize admin user
async function initializeAdminUser() {
  try {
    const existingAdmin = await User.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({ username: "admin", password: hashedPassword });
      console.log("✅ Admin user created (username: admin, password: admin123)");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}

// ==========================
// API Routes
// ==========================

// Get all seats
// GET /api/seats
app.get("/api/seats", async (req, res) => {
  try {
    const seats = await Seat.find().populate("studentId routeId");
    res.json(Array.isArray(seats) ? seats : []);
  } catch (error) {
    console.error("Failed to fetch seats:", error);
    res.status(500).json([]);
  }
});

// GET /api/students
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().populate("routeId");
    res.json(Array.isArray(students) ? students : []);
  } catch (error) {
    console.error("Failed to fetch students:", error);
    res.status(500).json([]);
  }
});

// GET /api/routes
app.get("/api/routes", async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(Array.isArray(routes) ? routes : []);
  } catch (error) {
    console.error("Failed to fetch routes:", error);
    res.status(500).json([]);
  }
});


// Add a student
app.post("/api/students", async (req, res) => {
  try {
    const { name, grade, routeId } = req.body;
    if (!name || !grade || !routeId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const student = new Student({ name, grade, routeId });
    await student.save();
    const populatedStudent = await Student.findById(student._id).populate("routeId");
    res.json(populatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add student" });
  }
});

// Add a route + generate seats
app.post("/api/routes", async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (!name || !capacity || capacity <= 0) {
      return res.status(400).json({ error: "Route name and valid capacity required" });
    }

    // 1️⃣ Create Route
    const route = new Route({ name, capacity });
    await route.save();

    // 2️⃣ Generate seats
    const seats = [];
    for (let i = 1; i <= capacity; i++) {
      seats.push({ seatNumber: i, isOccupied: false, routeId: route._id });
    }
    await Seat.insertMany(seats);

    res.json({ success: true, routeId: route._id, seatsCreated: capacity });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create route and seats" });
  }
});

// Assign a seat
app.post("/api/assign-seat", async (req, res) => {
  try {
    const { studentId, seatId } = req.body;

    const existingAssignment = await Seat.findOne({ studentId });
    if (existingAssignment) {
      return res.status(400).json({ error: "Student is already assigned to a seat" });
    }

    const seat = await Seat.findById(seatId);
    if (!seat) return res.status(400).json({ error: "Seat not found" });
    if (seat.isOccupied) return res.status(400).json({ error: "Seat is already occupied" });

    const student = await Student.findById(studentId).populate("routeId");
    if (!student) return res.status(400).json({ error: "Student not found" });

    seat.isOccupied = true;
    seat.studentId = studentId;
    seat.routeId = student.routeId._id;
    await seat.save();

    const populatedSeat = await Seat.findById(seat._id).populate("studentId routeId");
    res.json({ success: true, seat: populatedSeat });
  } catch (error) {
    console.error("Failed to assign seat:", error);
    res.status(500).json({ error: "Failed to assign seat" });
  }
});

// Remove seat assignment
app.post("/api/remove-seat", async (req, res) => {
  try {
    const { seatId } = req.body;
    const seat = await Seat.findById(seatId);
    if (!seat || !seat.isOccupied) {
      return res.status(400).json({ error: "Seat not occupied" });
    }

    seat.isOccupied = false;
    seat.studentId = null;
    seat.routeId = null;
    await seat.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove seat assignment" });
  }
});

// Reset all seats
app.post("/api/reset-seats", async (req, res) => {
  try {
    await Seat.updateMany({}, { 
      isOccupied: false, 
      studentId: null   // do not reset routeId
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset seats" });
  }
});

// Serve login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve main app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
