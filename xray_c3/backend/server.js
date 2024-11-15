const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:cdc@10.0.150.227:5432/postgres",
});

// API routes
app.get("/api/patients", async (req, res) => {
  try {
    const result = await pool.query("SELECT name, dob FROM patients");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/patients/:name/:dob", async (req, res) => {
  try {
    const { name, dob } = req.params;
    const result = await pool.query(
      "SELECT name, dob, gender, medical_history FROM patients WHERE name = $1 AND dob = $2",
      [name, dob]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "Patient not found" });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error("Error fetching patient:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch a random image for a patient
app.get("/api/patients/:name/:dob/random-xray", async (req, res) => {
  const { name, dob } = req.params;
  
  try {
    // Path to the uploads folder
    const uploadsPath = path.join(__dirname, "uploads");
    
    // Read the contents of the uploads folder
    fs.readdir(uploadsPath, (err, files) => {
      if (err) {
        console.error("Error reading uploads folder:", err);
        return res.status(500).json({ message: "Server error" });
      }

      // Filter the files to include only images (you can adjust extensions as needed)
      const imageFiles = files.filter(file =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );

      if (imageFiles.length === 0) {
        return res.status(404).json({ message: "No images found" });
      }

      // Select a random image from the available files
      const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];

      // Send the path of the random image
      res.json({ imagePath: `/uploads/${randomImage}` });
    });
  } catch (err) {
    console.error("Error fetching random X-ray:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Serve images from the uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
