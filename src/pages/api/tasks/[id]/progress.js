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

  // Verify task exists and user has access
  const taskRes = await pool.query(
    `
    SELECT t.id FROM tasks t
    JOIN days d ON t.day_id = d.id
    JOIN weeks w ON d.week_id = w.id
    JOIN phases p ON w.phase_id = p.id
    JOIN roadmaps r ON p.roadmap_id = r.id
    LEFT JOIN roadmap_assignments ra ON r.id = ra.roadmap_id AND ra.user_id = $1
    WHERE t.id = $2 AND (ra.access_type = 'learner' OR r.creator_id = $1 OR $3 = ANY(roles))
    `,
    [userId, taskId, "admin"]
  );
  if (taskRes.rowCount === 0) return res.status(403).json({ error: "No access to this task" });

  if (req.method === "PUT") {
    const { completed } = req.body;
    if (typeof completed !== "boolean") return res.status(400).json({ error: "Completed must be a boolean" });
    try {
      await pool.query(
        `
        INSERT INTO task_progress (task_id, user_id, completed)
        VALUES ($1, $2, $3)
        ON CONFLICT (task_id, user_id) DO UPDATE SET completed = $3
        `,
        [taskId, userId, completed]
      );
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}