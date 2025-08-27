import React from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import Day from "./Day";

const Week = ({ week, phaseIndex, weekIndex, updateRoadmap, access }) => {
  return (
    <Disclosure defaultOpen={false}>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-blue-100 px-4 py-2 text-left text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500/75">
            <span>{week.title}</span>
            <ChevronUpIcon className={`${open ? "transform rotate-180" : ""} w-5 h-5 text-blue-500`} />
          </Disclosure.Button>
          <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
            {week.days.map((day, dayIndex) => (
              <Day
                key={dayIndex}
                day={day}
                phaseIndex={phaseIndex}
                weekIndex={weekIndex}
                dayIndex={dayIndex}
                updateRoadmap={updateRoadmap}
                access={access}
              />
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Week;