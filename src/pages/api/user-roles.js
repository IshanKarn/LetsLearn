import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  console.log("Received request for /api/user-roles", req.method, req.body); // Debug log
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const result = await pool.query(
      "SELECT roles FROM users WHERE email = $1",
      [email]
    );
    console.log("Query result:", result.rows); // Debug log
    const user = result.rows[0];
    if (user) {
      console.log("Roles for", email, ":", user.roles);
      res.status(200).json({ roles: user.roles });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: "Server error" });
  }
}