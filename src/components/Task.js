import React, { useState } from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import NoteEditor from "./NoteEditor";

const categories = ["to_be_done", "to_be_practiced", "to_be_searched", "to_be_used_as_reference"];

const Task = ({ task, phaseIndex, weekIndex, dayIndex, taskIndex, updateRoadmap, access }) => {
  const [newNote, setNewNote] = useState({});
  const [error, setError] = useState(null);

  const isViewer = access === "viewer";
  const isCommenter = access === "commenter";

  const handleComplete = async (e) => {
    if (isViewer || isCommenter) return;
    try {
      setError(null);
      await updateRoadmap(phaseIndex, weekIndex, dayIndex, taskIndex, { ...task, completed: e.target.checked });
    } catch (err) {
      setError("Failed to update task completion");
      console.error(err);
    }
  };

  const addNote = async (category) => {
    if (isViewer) return;
    if (newNote[category] && newNote[category].trim()) {
      try {
        setError(null);
        const updatedNotes = {
          ...task.notes,
          [category]: [...task.notes[category], { id: null, content: newNote[category] }],
        };
        await updateRoadmap(phaseIndex, weekIndex, dayIndex, taskIndex, { ...task, notes: updatedNotes });
        setNewNote({ ...newNote, [category]: "" });
      } catch (err) {
        setError(`Failed to add note to ${category}`);
        console.error(err);
      }
    }
  };

  const deleteNote = async (noteId) => {
    if (isViewer) return;
    try {
      setError(null);
      await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await updateRoadmap(phaseIndex, weekIndex, dayIndex, taskIndex, task);
    } catch (err) {
      setError("Failed to delete note");
      console.error(err);
    }
  };

  return (
    <div className="mb-4 border-b pb-2">
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleComplete}
          className="mr-2"
          id={`task-${task.id}`}
          disabled={isViewer || isCommenter}
        />
        <label htmlFor={`task-${task.id}`}>{task.description}</label>
      </div>
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none">
              <span>Notes</span>
              <ChevronUpIcon className={`${open ? "transform rotate-180" : ""} w-5 h-5 text-gray-500`} />
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
              {categories.map((category) => (
                <div key={category} className="mb-2">
                  <h4 className="font-bold capitalize">{category.replace(/_/g, " ")}</h4>
                  <ul className="list-disc pl-5">
                    {task.notes[category].map((note, idx) => (
                      <li key={idx} className="flex items-center">
                        <NoteEditor
                          note={note}
                          taskId={task.id}
                          category={category}
                          updateRoadmap={updateRoadmap}
                          phaseIndex={phaseIndex}
                          weekIndex={weekIndex}
                          dayIndex={dayIndex}
                          taskIndex={taskIndex}
                          disabled={isViewer}
                        />
                        {note.id && !isViewer && (
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="ml-2 text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {!isViewer && (
                    <>
                      <input
                        type="text"
                        value={newNote[category] || ""}
                        onChange={(e) => setNewNote({ ...newNote, [category]: e.target.value })}
                        className="border p-1 mr-2"
                        placeholder="Add item..."
                        disabled={isViewer}
                      />
                      <button
                        onClick={() => addNote(category)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        disabled={isViewer}
                      >
                        Add
                      </button>
                    </>
                  )}
                </div>
              ))}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
};

export default Task;