import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ProgressBar from "../../components/ProgressBar";
import SearchBar from "../../components/SearchBar";
import TaskFilter from "../../components/TaskFilter";
import ExportButton from "../../components/ExportButton";
import Phase from "../../components/Phase";

export default function Roadmap({ roadmapId }) {
  const { data: session, status } = useSession();
  const [roadmap, setRoadmap] = useState(null);
  const [filteredRoadmap, setFilteredRoadmap] = useState(null);
  const [error, setError] = useState(null);
  const [access, setAccess] = useState(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/roadmaps/${roadmapId}`)
        .then((res) => res.json())
        .then((data) => {
          setRoadmap(data);
          setFilteredRoadmap(data);
          setAccess(data.access);
        })
        .catch((err) => setError("Failed to load roadmap"));
    }
  }, [status, roadmapId]);

  const updateRoadmap = async (phaseIdx, weekIdx, dayIdx, taskIdx, updatedTask) => {
    if (access !== "learner" && access !== "owner" && !session.user.roles.includes("admin")) {
      setError("No permission to update progress");
      return;
    }
    try {
      setError(null);
      // Update completion
      await fetch(`/api/tasks/${updatedTask.id}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: updatedTask.completed }),
      });

      // Update notes
      for (const [category, items] of Object.entries(updatedTask.notes)) {
        const existingNotes = roadmap.phases[phaseIdx].weeks[weekIdx].days[dayIdx].tasks[taskIdx].notes[category];
        const newNotes = items.filter(
          (item) => !existingNotes.some((existing) => existing.content === item.content && existing.id === item.id)
        );
        for (const note of newNotes) {
          if (!note.id) {
            await fetch(`/api/tasks/${updatedTask.id}/notes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ category, content: note.content }),
            });
          }
        }
      }

      // Refetch roadmap
      const res = await fetch(`/api/roadmaps/${roadmapId}`);
      const updatedData = await res.json();
      setRoadmap(updatedData);
      setFilteredRoadmap(updatedData);
    } catch (err) {
      setError("Update failed");
      console.error(err);
    }
  };

  if (status === "loading" || !roadmap) return <div>Loading...</div>;
  if (status !== "authenticated") return <div>Please <Link href="/auth/signin">sign in</Link></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Roadmap</h1>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex flex-col sm:flex-row sm:space-x-4">
          <SearchBar roadmap={roadmap} setFilteredRoadmap={setFilteredRoadmap} />
          <TaskFilter roadmap={roadmap} setFilteredRoadmap={setFilteredRoadmap} />
        </div>
        <ExportButton roadmap={filteredRoadmap} />
      </div>
      <ProgressBar roadmap={filteredRoadmap} />
      {filteredRoadmap.phases.map((phase, index) => (
        <Phase key={index} phase={phase} index={index} updateRoadmap={updateRoadmap} />
      ))}
    </main>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { roadmapId: params.id } };
}