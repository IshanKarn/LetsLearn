import React from 'react';

const ProgressBar = ({ roadmap }) => {
  const totalTasks = roadmap.phases.reduce((acc, phase) => 
    acc + phase.weeks.reduce((weekAcc, week) => 
      weekAcc + week.days.reduce((dayAcc, day) => 
        dayAcc + day.tasks.length, 0
      ), 0
    ), 0
  );

  const completedTasks = roadmap.phases.reduce((acc, phase) => 
    acc + phase.weeks.reduce((weekAcc, week) => 
      weekAcc + week.days.reduce((dayAcc, day) => 
        dayAcc + day.tasks.filter(task => task.completed).length, 0
      ), 0
    ), 0
  );

  const percentage = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">Progress: {percentage}%</h2>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-green-500 h-4 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600">
        {completedTasks} of {totalTasks} tasks completed
      </p>
    </div>
  );
};

export default ProgressBar;