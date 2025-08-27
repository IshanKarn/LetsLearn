import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const { data: session, status, update } = useSession();
  const [roadmaps, setRoadmaps] = useState([]);
  const [newRoadmap, setNewRoadmap] = useState({ title: "", phases: [{ title: "", weeks: [{ title: "", days: [{ title: "", tasks: [{ description: "", completed: false, notes: {} }] }] }] }] });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/roadmaps")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch roadmaps");
          return res.json();
        })
        .then(setRoadmaps)
        .catch((err) => setError(err.message));
    }
  }, [status]);

  const handleCreateRoadmap = async (e) => {
    e.preventDefault();
    if (session?.user.activeRole !== "planner" && !session?.user.roles.includes("admin")) {
      setError("Switch to Planner role to create roadmaps (set at login)");
      return;
    }
    try {
      const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoadmap),
      });
      if (res.ok) {
        const newRoadmapData = await res.json();
        setRoadmaps([...roadmaps, newRoadmapData]);
        setNewRoadmap({ title: "", phases: [{ title: "", weeks: [{ title: "", days: [{ title: "", tasks: [{ description: "", completed: false, notes: {} }] }] }] }] });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create roadmap");
      }
    } catch (err) {
      setError("Server error");
      console.error(err);
    }
  };

  const validateJsonStructure = (jsonData) => {
    if (!jsonData || typeof jsonData !== "object") return "Invalid JSON: Must be an object";
    if (!jsonData.title || typeof jsonData.title !== "string") return "Invalid JSON: 'title' is required and must be a string";
    if (!Array.isArray(jsonData.phases)) return "Invalid JSON: 'phases' must be an array";
    for (let phase of jsonData.phases) {
      if (!phase.title || typeof phase.title !== "string") return "Invalid JSON: Each phase must have a 'title' string";
      if (!Array.isArray(phase.weeks)) return "Invalid JSON: Each phase must have a 'weeks' array";
      for (let week of phase.weeks) {
        if (!week.title || typeof week.title !== "string") return "Invalid JSON: Each week must have a 'title' string";
        if (!Array.isArray(week.days)) return "Invalid JSON: Each week must have a 'days' array";
        for (let day of week.days) {
          if (!day.title || typeof day.title !== "string") return "Invalid JSON: Each day must have a 'title' string";
          if (!Array.isArray(day.tasks)) return "Invalid JSON: Each day must have a 'tasks' array";
          for (let task of day.tasks) {
            if (!task.description || typeof task.description !== "string") return "Invalid JSON: Each task must have a 'description' string";
            if (typeof task.completed !== "boolean") return "Invalid JSON: Each task must have a 'completed' boolean";
            if (task.notes && typeof task.notes !== "object") return "Invalid JSON: 'notes' must be an object if present";
            if (task.notes && (!Array.isArray(task.notes.to_be_done) || !Array.isArray(task.notes.to_be_practiced) || !Array.isArray(task.notes.to_be_searched) || !Array.isArray(task.notes.to_be_used_as_reference))) {
              return "Invalid JSON: 'notes' must contain arrays for to_be_done, to_be_practiced, to_be_searched, to_be_used_as_reference";
            }
          }
        }
      }
    }
    return null;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadedFile) {
      setError("Please select a JSON file to upload");
      return;
    }
    if (session?.user.activeRole !== "planner" && !session?.user.roles.includes("admin")) {
      setError("Switch to Planner role to create roadmaps (set at login)");
      return;
    }
    try {
      const text = await uploadedFile.text();
      const roadmapData = JSON.parse(text);
      const validationError = validateJsonStructure(roadmapData);
      if (validationError) {
        setError(validationError);
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch("/api/roadmaps/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const newRoadmap = await res.json();
        setRoadmaps([...roadmaps, newRoadmap]);
        setUploadedFile(null);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to upload roadmap");
      }
    } catch (err) {
      setError("Invalid JSON format or server error");
      console.error(err);
    }
  };

  const addPhase = () => setNewRoadmap(prev => ({ ...prev, phases: [...prev.phases, { title: "", weeks: [{ title: "", days: [{ title: "", tasks: [{ description: "", completed: false, notes: {} }] }] }] }] }));
  const addWeek = (phaseIndex) => setNewRoadmap(prev => {
    const phases = [...prev.phases];
    phases[phaseIndex].weeks.push({ title: "", days: [{ title: "", tasks: [{ description: "", completed: false, notes: {} }] }] });
    return { ...prev, phases };
  });
  const addDay = (phaseIndex, weekIndex) => setNewRoadmap(prev => {
    const phases = [...prev.phases];
    phases[phaseIndex].weeks[weekIndex].days.push({ title: "", tasks: [{ description: "", completed: false, notes: {} }] });
    return { ...prev, phases };
  });
  const addTask = (phaseIndex, weekIndex, dayIndex) => setNewRoadmap(prev => {
    const phases = [...prev.phases];
    phases[phaseIndex].weeks[weekIndex].days[dayIndex].tasks.push({ description: "", completed: false, notes: {} });
    return { ...prev, phases };
  });

  const handleInputChange = (e, section, index, subIndex, subSubIndex) => {
    const { name, value } = e.target;
    setNewRoadmap(prev => {
      const phases = [...prev.phases];
      if (section === "title") phases[index][name] = value;
      else if (section === "week") phases[index].weeks[subIndex][name] = value;
      else if (section === "day") phases[index].weeks[subIndex].days[subSubIndex][name] = value;
      else if (section === "task") phases[index].weeks[subIndex].days[subSubIndex].tasks[subIndex][name] = value;
      return { ...prev, phases };
    });
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Please <Link href="/auth/signin">sign in</Link></div>;

  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Learning Tracker</h1>
        <h1 className="text-1xl font-bold">Create and follow Learning Roadmaps. Track and categorize tasks, attach notes, questions. Share your progress and get reviews from peers. Keep learning, keep building...</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
      <p>Welcome, {session.user.name} (Active Role: {session.user.activeRole})</p>
      {error && <p className="text-red-500">{error}</p>}
      {(session.user.activeRole === "planner" || session.user.roles.includes("admin")) && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Create New Roadmap</h2>
          {/* Manual Creation Form */}
          <form onSubmit={handleCreateRoadmap} className="mb-4">
            <input
              type="text"
              name="title"
              value={newRoadmap.title}
              onChange={(e) => handleInputChange(e, "title", 0)}
              placeholder="Roadmap Title"
              className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {newRoadmap.phases.map((phase, pIndex) => (
              <div key={pIndex} className="ml-4 mb-4 border p-2 rounded">
                <input
                  type="text"
                  name="title"
                  value={phase.title}
                  onChange={(e) => handleInputChange(e, "title", pIndex)}
                  placeholder={`Phase ${pIndex + 1} Title`}
                  className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {phase.weeks.map((week, wIndex) => (
                  <div key={wIndex} className="ml-4 mb-4 border p-2 rounded">
                    <input
                      type="text"
                      name="title"
                      value={week.title}
                      onChange={(e) => handleInputChange(e, "week", pIndex, wIndex)}
                      placeholder={`Week ${wIndex + 1} Title`}
                      className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {week.days.map((day, dIndex) => (
                      <div key={dIndex} className="ml-4 mb-4 border p-2 rounded">
                        <input
                          type="text"
                          name="title"
                          value={day.title}
                          onChange={(e) => handleInputChange(e, "day", pIndex, wIndex, dIndex)}
                          placeholder={`Day ${dIndex + 1} Title`}
                          className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        {day.tasks.map((task, tIndex) => (
                          <div key={tIndex} className="ml-4 mb-2 border p-2 rounded">
                            <input
                              type="text"
                              name="description"
                              value={task.description}
                              onChange={(e) => handleInputChange(e, "task", pIndex, wIndex, dIndex, tIndex)}
                              placeholder={`Task ${tIndex + 1} Description`}
                              className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        ))}
                        <button type="button" onClick={() => addTask(pIndex, wIndex, dIndex)} className="bg-green-500 text-white px-2 py-1 rounded">Add Task</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addDay(pIndex, wIndex)} className="bg-green-500 text-white px-2 py-1 rounded">Add Day</button>
                  </div>
                ))}
                <button type="button" onClick={() => addWeek(pIndex)} className="bg-green-500 text-white px-2 py-1 rounded">Add Week</button>
              </div>
            ))}
            <button type="button" onClick={addPhase} className="bg-green-500 text-white px-2 py-1 rounded">Add Phase</button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2">Create Roadmap</button>
          </form>
          {/* File Upload Form */}
          <form onSubmit={handleFileUpload}>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setUploadedFile(e.target.files[0])}
              className="border p-2 mb-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Upload JSON Roadmap
            </button>
          </form>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-2">Your Roadmaps</h2>
      {roadmaps.length === 0 ? (
        <p>No roadmaps available</p>
      ) : (
        <ul>
          {roadmaps.map((rm) => (
            <li key={rm.id} className="mb-2">
              <Link href={`/roadmap/${rm.id}`} className="text-blue-500 hover:underline">
                {rm.title}
              </Link>
              {(session.user.activeRole === "planner" || session.user.roles.includes("admin")) && (
                <button
                  onClick={() => router.push(`/roadmap/${rm.id}/assign`)}
                  className="ml-2 text-green-500 hover:underline"
                >
                  Manage Assignments
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}