import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const taskId = req.query.id;
  const userId = session.user.id;
  const roles = session.user.roles;

  // Verify access (learner or commenter)
  const taskRes = await pool.query(
    `
    SELECT t.id FROM tasks t
    JOIN days d ON t.day_id = d.id
    JOIN weeks w ON d.week_id = w.id
    JOIN phases p ON w.phase_id = p.id
    JOIN roadmaps r ON p.roadmap_id = r.id
    LEFT JOIN roadmap_assignments ra ON r.id = ra.roadmap_id AND ra.user_id = $1
    WHERE t.id = $2 AND (ra.access_type IN ('learner', 'commenter') OR r.creator_id = $1 OR $3 = ANY(roles))
    `,
    [userId, taskId, "admin"]
  );
  if (taskRes.rowCount === 0) return res.status(403).json({ error: "No access to add notes" });

  if (req.method === "POST") {
    const { category, content } = req.body;
    if (!["to_be_done", "to_be_practiced", "to_be_searched", "to_be_used_as_reference"].includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Content must be a non-empty string" });
    }
    try {
      await pool.query(
        "INSERT INTO notes (task_id, user_id, category, content) VALUES ($1, $2, $3, $4)",
        [taskId, userId, category, content]
      );
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}