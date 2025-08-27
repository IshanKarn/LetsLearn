import bcrypt from "bcrypt";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (email, password, name, roles) VALUES ($1, $2, $3, $4)",
      [email, hashedPassword, name, JSON.stringify(["learner", "planner"])]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    res.status(400).json({ error: err.message || "User already exists or server error" });
  }
}