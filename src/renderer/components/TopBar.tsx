import React, { useState, useEffect } from 'react';
import { Video, Circle } from 'lucide-react';

import { StreamingProvider } from '../types';

interface TopBarProps {

  isStreaming: boolean;
  isRecording: boolean;
  streamStartTime: number | null;
  recordStartTime: number | null;
  selectedProvider?: StreamingProvider | null;
  bitrate?: number;
}

const formatElapsedTime = (startTime: number | null): string => {
  if (!startTime) return '00:00:00';
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const TopBar: React.FC<TopBarProps> = ({

  isStreaming,
  isRecording,
  streamStartTime,
  recordStartTime,
  selectedProvider,
  bitrate,
}) => {
  const [, setTick] = useState(0);

  // Update timer every second
  useEffect(() => {
    if (isStreaming || isRecording) {
      const interval = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming, isRecording]);

  return (
    <div className="h-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 select-none shrink-0 text-gray-900 dark:text-white transition-colors duration-200 relative z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-blue-600 font-bold text-xl">
          <img
            src="/logo.png"
            alt="River Studio"
            className="w-8 h-8 absolute top-1/6 left-10 object-contain"
          />
          <span className="pl-20">River Studio</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-4">
        {isStreaming && (
          <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-md text-sm font-medium">
            <Circle
              size={12}
              className="fill-red-600 dark:fill-red-500 animate-pulse"
            />
            <span>
              LIVE{selectedProvider ? `: ${selectedProvider.name}` : ''}
            </span>
            <span className="font-mono">
              {formatElapsedTime(streamStartTime)}
            </span>
            {bitrate !== undefined && bitrate > 0 && (
              <span className="ml-2 font-mono text-[10px] opacity-80 border-l border-red-300 dark:border-red-700 pl-2">
                {bitrate.toLocaleString()} kb/s
              </span>
            )}
          </div>
        )}
        {isRecording && (
          <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md text-sm font-medium">
            <Video size={14} className="fill-blue-600 dark:fill-blue-500" />
            <span>REC</span>
            <span className="font-mono">
              {formatElapsedTime(recordStartTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
