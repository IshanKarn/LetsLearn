import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Assign({ roadmapId }) {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newUserId, setNewUserId] = useState("");
  const [accessType, setAccessType] = useState("learner");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch all users (for admin/planner)
      fetch("/api/users")
        .then((res) => res.json())
        .then(setUsers)
        .catch(() => setError("Failed to load users"));
      // Fetch current assignments
      fetch(`/api/roadmaps/${roadmapId}/assignments`)
        .then((res) => res.json())
        .then(setAssignments)
        .catch(() => setError("Failed to load assignments"));
    }
  }, [status, roadmapId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: newUserId, access_type: accessType }),
      });
      if (res.ok) {
        setAssignments([...assignments, { user_id: newUserId, access_type: accessType }]);
        setNewUserId("");
      } else {
        setError("Failed to assign user");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  const handleRemove = async (userId) => {
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        setAssignments(assignments.filter((a) => a.user_id !== userId));
      } else {
        setError("Failed to remove assignment");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!session || !session.user.roles.includes("planner")) {
    return <div>Access denied. <Link href="/">Back to home</Link></div>;
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Assignments for Roadmap {roadmapId}</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleAssign} className="mb-4">
        <select
          value={newUserId}
          onChange={(e) => setNewUserId(e.target.value)}
          className="border p-2 mr-2"
          required
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        <select
          value={accessType}
          onChange={(e) => setAccessType(e.target.value)}
          className="border p-2 mr-2"
        >
          <option value="learner">Learner</option>
          <option value="viewer">Viewer</option>
          <option value="commenter">Commenter</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Assign
        </button>
      </form>
      <h2 className="text-xl font-semibold mb-2">Current Assignments</h2>
      <ul>
        {assignments.map((assignment) => (
          <li key={assignment.user_id} className="mb-2">
            User ID: {assignment.user_id} - {assignment.access_type}
            <button
              onClick={() => handleRemove(assignment.user_id)}
              className="ml-2 text-red-500 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <Link href={`/roadmap/${roadmapId}`} className="text-blue-500 hover:underline">
        Back to Roadmap
      </Link>
    </main>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { roadmapId: params.id } };
}