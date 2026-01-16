import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Source } from '../../types';

interface AudioChannelProps {
  id: string;
  name: string;
  volume: number; // 0 to 1
  active: boolean;
  onChange: (id: string, vol: number) => void;
  onToggleMute: (id: string) => void;
}

const AudioChannel: React.FC<AudioChannelProps> = ({
  id,
  name,
  volume,
  active,
  onChange,
  onToggleMute,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const meterRef = useRef<HTMLDivElement>(null);

  const handleInteraction = (clientX: number) => {
    if (!meterRef.current) return;
    const rect = meterRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newVol = x / rect.width;
    onChange(id, newVol);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleInteraction(e.clientX);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`flex items-center space-x-3 mb-3 text-xs ${!active ? 'opacity-60' : ''}`}
    >
      <div
        className="w-24 truncate text-right text-gray-600 dark:text-gray-400 font-medium shrink-0 cursor-default"
        title={name}
      >
        {name}
      </div>
      <div className="flex-grow flex flex-col space-y-1">
        {/* Interactive Meter */}
        <div
          ref={meterRef}
          className="h-4 bg-gray-300 dark:bg-gray-700 rounded-sm relative overflow-hidden cursor-pointer group"
          onMouseDown={handleMouseDown}
        >
          <div
            className={`absolute top-0 left-0 bottom-0 transition-all duration-75 ease-out ${active ? 'bg-blue-500' : 'bg-gray-500 dark:bg-gray-600'}`}
            style={{ width: `${volume * 100}%` }}
          ></div>
          {/* Tick marks */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-px h-full bg-white/30"></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-1 shrink-0 text-gray-600 dark:text-gray-400">
        <div className="text-[10px] w-8 text-right font-mono tabular-nums">
          {active
            ? `${(Math.log10(Math.max(volume, 0.001)) * 20).toFixed(0)} dB`
            : 'Muted'}
        </div>
        <button
          onClick={() => onToggleMute(id)}
          className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded ${!active ? 'text-red-500' : ''}`}
        >
          {active ? <Volume2 size={12} /> : <VolumeX size={12} />}
        </button>
      </div>
    </div>
  );
};

interface AudioMixerDockProps {
  sources: Source[];
  volumes: Record<string, number>;
  muted: Record<string, boolean>;
  onVolumeChange: (id: string, vol: number) => void;
  onToggleMute: (id: string) => void;
}

export const AudioMixerDock: React.FC<AudioMixerDockProps> = ({
  sources,
  volumes,
  muted,
  onVolumeChange,
  onToggleMute,
}) => {
  // Filter sources that should have audio
  const audioSources = sources.filter((s) =>
    ['video', 'browser', 'audio'].includes(s.type)
  );

  // Only include Mic (which is actually implemented)
  const allChannels = [
    { id: 'mic', name: 'Mic/Aux', type: 'system' },
    ...audioSources,
  ];

  return (
    <div className="p-4 h-full overflow-y-auto">
      {allChannels.map((ch) => (
        <AudioChannel
          key={ch.id}
          id={ch.id}
          name={ch.name}
          volume={volumes[ch.id] ?? 0.8}
          active={!muted[ch.id]}
          onChange={onVolumeChange}
          onToggleMute={onToggleMute}
        />
      ))}
    </div>
  );
};
