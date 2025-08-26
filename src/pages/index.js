'use client';

import React, { useState, useEffect } from 'react';
import Phase from '../components/Phase';
import ProgressBar from '../components/ProgressBar';
import SearchBar from '../components/SearchBar';
import ExportButton from '../components/ExportButton';
import TaskFilter from '../components/TaskFilter';

export default function Home() {
  const [roadmap, setRoadmap] = useState(null);
  const [filteredRoadmap, setFilteredRoadmap] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/roadmap')
      .then((res) => res.json())
      .then((data) => {
        setRoadmap(data);
        setFilteredRoadmap(data);
      })
      .catch((err) => console.error('Failed to fetch roadmap:', err));
  }, []);

  const updateRoadmap = async (phaseIdx, weekIdx, dayIdx, taskIdx, updatedTask) => {
    try {
      // Update completion
      await fetch(`http://localhost:5000/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: updatedTask.completed }),
      });

      // Update notes
      for (const [category, items] of Object.entries(updatedTask.notes)) {
        const existingNotes = roadmap.phases[phaseIdx].weeks[weekIdx].days[dayIdx].tasks[taskIdx].notes[category];
        const newNotes = items.filter((item) => !existingNotes.some((existing) => existing.content === item.content && existing.id === item.id));
        for (const note of newNotes) {
          if (!note.id) {
            await fetch(`http://localhost:5000/api/tasks/${updatedTask.id}/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category, content: note.content }),
            });
          }
        }
      }

      // Refetch roadmap to sync state
      const res = await fetch('http://localhost:5000/api/roadmap');
      const updatedData = await res.json();
      setRoadmap(updatedData);
      setFilteredRoadmap(updatedData); // Reset filtered roadmap
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  if (!filteredRoadmap) return <div>Loading...</div>;

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Learning Tracker</h1>
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