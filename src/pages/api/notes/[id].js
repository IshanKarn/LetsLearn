import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const noteId = req.query.id;
  const userId = session.user.id;
  const roles = session.user.roles;

  // Verify note ownership or admin
  const noteRes = await pool.query(
    "SELECT n.id FROM notes n WHERE n.id = $1 AND (n.user_id = $2 OR $3 = ANY(roles))",
    [noteId, userId, "admin"]
  );
  if (noteRes.rowCount === 0) return res.status(403).json({ error: "No access to this note" });

  if (req.method === "PUT") {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Content must be a non-empty string" });
    }
    try {
      const result = await pool.query(
        "UPDATE notes SET content = $1 WHERE id = $2 RETURNING *",
        [content, noteId]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: "Note not found" });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else if (req.method === "DELETE") {
    try {
      const result = await pool.query("DELETE FROM notes WHERE id = $1 RETURNING *", [noteId]);
      if (result.rowCount === 0) return res.status(404).json({ error: "Note not found" });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}