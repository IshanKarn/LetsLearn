import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  const { method } = req;

  if (method === "GET") {
    try {
      const result = await pool.query("SELECT * FROM roadmaps");
      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
      res.status(500).json({ error: "Server error" });
    }
  } else if (method === "POST") {
    // Manual creation
    const { title, phases } = req.body;
    if (!title || !phases || !Array.isArray(phases)) return res.status(400).json({ error: "Title and phases are required" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const roadmapResult = await client.query(
        "INSERT INTO roadmaps (title, creator_id) VALUES ($1, $2) RETURNING *",
        [title, req.user?.id || 1]
      );
      const roadmap = roadmapResult.rows[0];

      for (const phase of phases) {
        const phaseResult = await client.query(
          "INSERT INTO phases (roadmap_id, title) VALUES ($1, $2) RETURNING *",
          [roadmap.id, phase.title]
        );
        const phaseId = phaseResult.rows[0].id;

        for (const week of phase.weeks) {
          const weekResult = await client.query(
            "INSERT INTO weeks (phase_id, title) VALUES ($1, $2) RETURNING *",
            [phaseId, week.title]
          );
          const weekId = weekResult.rows[0].id;

          for (const day of week.days) {
            const dayResult = await client.query(
              "INSERT INTO days (week_id, title) VALUES ($1, $2) RETURNING *",
              [weekId, day.title]
            );
            const dayId = dayResult.rows[0].id;

            for (const task of day.tasks) {
              await client.query(
                "INSERT INTO tasks (day_id, description, completed, notes) VALUES ($1, $2, $3, $4)",
                [dayId, task.description, task.completed, task.notes ? JSON.stringify(task.notes) : null]
              );
            }
          }
        }
      }

      await client.query("COMMIT");
      res.status(201).json(roadmap);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error creating roadmap:", err);
      res.status(400).json({ error: "Failed to create roadmap" });
    } finally {
      client.release();
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// File upload endpoint
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !file.name.endsWith(".json")) {
    return res.status(400).json({ error: "Please upload a valid JSON file" });
  }

  try {
    const text = await file.text();
    const roadmapData = JSON.parse(text);
    if (!roadmapData.title || !Array.isArray(roadmapData.phases)) {
      return res.status(400).json({ error: "Invalid JSON format. Requires 'title' and 'phases' array" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const roadmapResult = await client.query(
        "INSERT INTO roadmaps (title, creator_id) VALUES ($1, $2) RETURNING *",
        [roadmapData.title, req.user?.id || 1]
      );
      const roadmap = roadmapResult.rows[0];

      for (const phase of roadmapData.phases) {
        const phaseResult = await client.query(
          "INSERT INTO phases (roadmap_id, title) VALUES ($1, $2) RETURNING *",
          [roadmap.id, phase.title]
        );
        const phaseId = phaseResult.rows[0].id;

        for (const week of phase.weeks) {
          const weekResult = await client.query(
            "INSERT INTO weeks (phase_id, title) VALUES ($1, $2) RETURNING *",
            [phaseId, week.title]
          );
          const weekId = weekResult.rows[0].id;

          for (const day of week.days) {
            const dayResult = await client.query(
              "INSERT INTO days (week_id, title) VALUES ($1, $2) RETURNING *",
              [weekId, day.title]
            );
            const dayId = dayResult.rows[0].id;

            for (const task of day.tasks) {
              await client.query(
                "INSERT INTO tasks (day_id, description, completed, notes) VALUES ($1, $2, $3, $4)",
                [dayId, task.description, task.completed, task.notes ? JSON.stringify(task.notes) : null]
              );
            }
          }
        }
      }

      await client.query("COMMIT");
      res.status(201).json(roadmap);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error uploading roadmap:", err);
      res.status(500).json({ error: "Failed to upload roadmap" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error parsing JSON:", err);
    res.status(400).json({ error: "Invalid JSON format" });
  }
}