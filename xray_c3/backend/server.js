const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const upload = multer();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:cdc@localhost:3000/cdc",
});

// Create patients table if it doesn't exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS patients (
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(50) NOT NULL,
    medical_history TEXT,
    xray_image BYTEA,
    CONSTRAINT patient_unique UNIQUE (name, dob)
  )
`;

pool
  .query(createTableQuery)
  .then(() => console.log("Patients table created or already exists"))
  .catch((err) => console.error("Error creating patients table:", err));

// API routes
// app.get("/api/patients", async (req, res) => {
//   try {
//     const { name, dob } = req.params;

//     const result = await pool.query("SELECT name, dob FROM patients");
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching patients:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

app.get("/api/patients", async (req, res) => {
  try {
    const { name, dob } = req.query;

    let query = "SELECT name, dob FROM patients";
    const params = [];
    const conditions = [];

    if (name) {
      conditions.push("name = $1");
      params.push(name);
    }

    if (dob) {
      conditions.push("dob = $" + (params.length + 1));
      params.push(dob);
    }

    // Append conditions if there are any
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const result = await pool.query(query, params);
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

app.get("/api/patients/:name/:dob/xray", async (req, res) => {
  try {
    const { name, dob } = req.params;
    const result = await pool.query(
      "SELECT xray_image_path FROM patients WHERE name = $1 AND dob = $2",
      [name, dob]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "Patient not found" });
    } else {
      res.contentType("plain/text");
      res.send(result.rows[0].xray_image_path);
    }
  } catch (err) {
    console.error("Error fetching X-ray:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/patients", upload.single("xrayImage"), async (req, res) => {
  const { name, dob, gender, medicalHistory } = req.body;
  const xrayImage = req.file.buffer;

  try {
    const result = await pool.query(
      "INSERT INTO patients (name, dob, gender, medical_history, xray_image_path) VALUES ($1, $2, $3, $4, $5) RETURNING name, dob",
      [name, dob, gender, medicalHistory, xrayImage]
    );
    res.status(201).json({
      message: "Patient created successfully",
      name: result.rows[0].name,
      dob: result.rows[0].dob,
    });
  } catch (err) {
    console.error("Error creating patient:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
