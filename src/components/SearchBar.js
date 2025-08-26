import React, { useState } from 'react';

const SearchBar = ({ roadmap, setFilteredRoadmap }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (!term) {
      setFilteredRoadmap(roadmap);
      return;
    }

    const filtered = {
      phases: roadmap.phases.map(phase => ({
        ...phase,
        weeks: phase.weeks.map(week => ({
          ...week,
          days: week.days.map(day => ({
            ...day,
            tasks: day.tasks.filter(task => task.description.toLowerCase().includes(term))
          })).filter(day => day.tasks.length > 0)
        })).filter(week => week.days.length > 0)
      })).filter(phase => phase.weeks.length > 0)
    };

    setFilteredRoadmap(filtered);
  };

  return (
    <div className="mb-6">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search tasks..."
        className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default SearchBar;