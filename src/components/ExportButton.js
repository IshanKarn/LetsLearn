import React from 'react';

const ExportButton = ({ roadmap }) => {
  const handleExport = () => {
    const dataStr = JSON.stringify(roadmap, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'learning_tracker_progress.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
    >
      Export Progress
    </button>
  );
};

export default ExportButton;