import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
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

  // Check access
  const accessRes = await pool.query(
    `
    SELECT access_type FROM roadmap_assignments WHERE roadmap_id = $1 AND user_id = $2
    UNION SELECT 'owner' AS access_type FROM roadmaps WHERE id = $1 AND creator_id = $2
    `,
    [roadmapId, userId]
  );
  const access = accessRes.rows[0]?.access_type;
  if (!access && !roles.includes("admin")) {
    return res.status(403).json({ error: "No access to this roadmap" });
  }

  const isViewer = access === "viewer";
  const isCommenter = access === "commenter";

  if (req.method === "GET") {
    try {
      const phasesResult = await pool.query("SELECT * FROM phases WHERE roadmap_id = $1", [roadmapId]);
      const phases = phasesResult.rows;

      for (let phase of phases) {
        const weeksResult = await pool.query("SELECT * FROM weeks WHERE phase_id = $1", [phase.id]);
        phase.weeks = weeksResult.rows;

        for (let week of phase.weeks) {
          const daysResult = await pool.query("SELECT * FROM days WHERE week_id = $1", [week.id]);
          week.days = daysResult.rows;

          for (let day of week.days) {
            const tasksResult = await pool.query("SELECT * FROM tasks WHERE day_id = $1", [day.id]);
            day.tasks = tasksResult.rows;

            for (let task of day.tasks) {
              // Fetch user-specific progress
              const progressRes = await pool.query(
                "SELECT completed FROM task_progress WHERE task_id = $1 AND user_id = $2",
                [task.id, userId]
              );
              task.completed = progressRes.rows[0]?.completed || false;

              // Fetch user-specific notes
              const notesResult = await pool.query(
                "SELECT id, category, content FROM notes WHERE task_id = $1 AND user_id = $2",
                [task.id, userId]
              );
              task.notes = {
                to_be_done: [],
                to_be_practiced: [],
                to_be_searched: [],
                to_be_used_as_reference: [],
              };
              notesResult.rows.forEach((note) => {
                task.notes[note.category].push({ id: note.id, content: note.content });
              });
            }
          }
        }
      }
      res.status(200).json({ phases, access });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}