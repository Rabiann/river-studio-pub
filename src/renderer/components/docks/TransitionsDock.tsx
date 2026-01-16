import React from 'react';

interface TransitionsDockProps {
  transitionType: 'cut' | 'fade';
  setTransitionType: (type: 'cut' | 'fade') => void;
  transitionDuration: number;
  setTransitionDuration: (duration: number) => void;
}

export const TransitionsDock: React.FC<TransitionsDockProps> = ({
  transitionType,
  setTransitionType,
  transitionDuration,
  setTransitionDuration,
}) => {
  return (
    <div className="p-4 h-full flex flex-col justify-center space-y-4">
      <div className="space-y-2">
        <div
          className={`flex items-center justify-between cursor-pointer p-1 rounded ${transitionType === 'cut' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
          onClick={() => setTransitionType('cut')}
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">Cut</span>
          <div
            className={`w-4 h-4 rounded-full border ${transitionType === 'cut' ? 'border-[5px] border-blue-600' : 'border-gray-400 dark:border-gray-600'}`}
          ></div>
        </div>
        <div
          className={`flex items-center justify-between cursor-pointer p-1 rounded ${transitionType === 'fade' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
          onClick={() => setTransitionType('fade')}
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">Fade</span>
          <div
            className={`w-4 h-4 rounded-full border ${transitionType === 'fade' ? 'border-[5px] border-blue-600' : 'border-gray-400 dark:border-gray-600'}`}
          ></div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
          Duration
        </span>
        <div className="flex-grow relative">
          <input
            type="number"
            value={transitionDuration}
            onChange={(e) => setTransitionDuration(Number(e.target.value))}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded px-2 py-1 text-sm text-right pr-8 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
          />
          <span className="absolute right-2 top-1.5 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
            ms
          </span>
        </div>
      </div>
    </div>
  );
};
