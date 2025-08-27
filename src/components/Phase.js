import React from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import Week from "./Week";

const Phase = ({ phase, index, updateRoadmap, access }) => {
  return (
    <Disclosure defaultOpen={false}>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-purple-100 px-4 py-2 text-left text-sm font-medium text-purple-900 hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500/75">
            <span>{phase.title}</span>
            <ChevronUpIcon className={`${open ? "transform rotate-180" : ""} w-5 h-5 text-purple-500`} />
          </Disclosure.Button>
          <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-gray-500">
            {phase.weeks.map((week, weekIndex) => (
              <Week
                key={weekIndex}
                week={week}
                phaseIndex={index}
                weekIndex={weekIndex}
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

export default Phase;