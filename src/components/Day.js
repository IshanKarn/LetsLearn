import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import Task from './Task';

const Day = ({ day, phaseIndex, weekIndex, dayIndex, updateRoadmap }) => {
  return (
    <Disclosure defaultOpen={false}>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-green-100 px-4 py-2 text-left text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring focus-visible:ring-green-500/75">
            <span>{day.title}</span>
            <ChevronUpIcon className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-green-500`} />
          </Disclosure.Button>
          <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
            {day.tasks.map((task, taskIndex) => (
              <Task key={taskIndex} task={task} phaseIndex={phaseIndex} weekIndex={weekIndex} dayIndex={dayIndex} taskIndex={taskIndex} updateRoadmap={updateRoadmap} />
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Day;