import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "PUT") {
    const { activeRole } = req.body;
    if (!session.user.roles.includes(activeRole)) {
      return res.status(403).json({ error: "Invalid role" });
    }
    // Update session (handled client-side via re-auth or token refresh)
    res.status(200).json({ success: true, activeRole });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}