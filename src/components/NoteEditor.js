import React, { useState } from "react";

const NoteEditor = ({ note, taskId, category, updateRoadmap, phaseIndex, weekIndex, dayIndex, taskIndex, disabled }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(note.content);
  const [error, setError] = useState(null);

  const handleEdit = async () => {
    if (disabled) return;
    if (editedContent.trim() === "") {
      setError("Content cannot be empty");
      return;
    }
    try {
      setError(null);
      await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editedContent }),
      });
      const updatedNotes = { ...note, content: editedContent };
      const task = {
        id: taskId,
        notes: {
          to_be_done: [],
          to_be_practiced: [],
          to_be_searched: [],
          to_be_used_as_reference: [],
          [category]: [{ id: note.id, content: editedContent }],
        },
      };
      await updateRoadmap(phaseIndex, weekIndex, dayIndex, taskIndex, task);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update note");
      console.error(err);
    }
  };

  return (
    <div className="flex items-center">
      {isEditing && !disabled ? (
        <>
          <input
            type="text"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="border p-1 mr-2 flex-grow"
          />
          <button
            onClick={handleEdit}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 mr-2"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          {error && <span className="text-red-500 ml-2">{error}</span>}
        </>
      ) : (
        <>
          <span>{note.content}</span>
          {!disabled && (
            <button
              onClick={() => setIsEditing(true)}
              className="ml-2 text-blue-500 hover:underline"
            >
              Edit
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default NoteEditor;