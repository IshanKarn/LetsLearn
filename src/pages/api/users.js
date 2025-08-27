import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || (!session.user.roles.includes("planner") && !session.user.roles.includes("admin"))) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const result = await pool.query("SELECT id, name, email FROM users");
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}