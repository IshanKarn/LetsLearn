import React, { useState } from 'react';

const TaskFilter = ({ roadmap, setFilteredRoadmap }) => {
  const [filter, setFilter] = useState('all');

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilter(value);

    if (value === 'all') {
      setFilteredRoadmap(roadmap);
      return;
    }

    const completed = value === 'completed';
    const filtered = {
      phases: roadmap.phases.map(phase => ({
        ...phase,
        weeks: phase.weeks.map(week => ({
          ...week,
          days: week.days.map(day => ({
            ...day,
            tasks: day.tasks.filter(task => task.completed === completed)
          })).filter(day => day.tasks.length > 0)
        })).filter(week => week.days.length > 0)
      })).filter(phase => phase.weeks.length > 0)
    };

    setFilteredRoadmap(filtered);
  };

  return (
    <div className="mb-4">
      <label htmlFor="task-filter" className="mr-2">Filter Tasks:</label>
      <select
        id="task-filter"
        value={filter}
        onChange={handleFilterChange}
        className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Tasks</option>
        <option value="completed">Completed</option>
        <option value="incomplete">Incomplete</option>
      </select>
    </div>
  );
};

export default TaskFilter;