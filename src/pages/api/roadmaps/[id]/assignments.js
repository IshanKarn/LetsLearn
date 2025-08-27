import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const roadmapId = req.query.id;
  const userId = session.user.id;
  const roles = session.user.roles;

  // Verify planner or admin
  const roadmapRes = await pool.query(
    "SELECT id FROM roadmaps WHERE id = $1 AND (creator_id = $2 OR $3 = ANY(roles))",
    [roadmapId, userId, "admin"]
  );
  if (roadmapRes.rowCount === 0) return res.status(403).json({ error: "No access to manage assignments" });

  if (req.method === "POST") {
    const { user_id, access_type } = req.body;
    if (!["learner", "viewer", "commenter"].includes(access_type)) {
      return res.status(400).json({ error: "Invalid access type" });
    }
    try {
      await pool.query(
        "INSERT INTO roadmap_assignments (roadmap_id, user_id, access_type) VALUES ($1, $2, $3)",
        [roadmapId, user_id, access_type]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else if (req.method === "DELETE") {
    const { user_id } = req.body;
    try {
      const result = await pool.query(
        "DELETE FROM roadmap_assignments WHERE roadmap_id = $1 AND user_id = $2 RETURNING *",
        [roadmapId, user_id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: "Assignment not found" });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}