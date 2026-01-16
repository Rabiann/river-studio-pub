import React from 'react';
import { ModalType, StreamingProvider } from '../../types';
import { ChevronDown } from 'lucide-react';

interface ControlsDockProps {
  setModal: (type: ModalType) => void;
  isStreaming: boolean;
  onStartStream: (provider: StreamingProvider, customUrl?: string) => void;
  onStopStream: () => void;
  rtmpUrl: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isPaused?: boolean;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;

  onExit: () => void;
}

const PROVIDERS: StreamingProvider[] = [
  { id: 'twitch', name: 'Twitch', url: 'rtmp://ingest.global-contribute.live-video.net/app/' },
  { id: 'youtube', name: 'YouTube', url: 'rtmp://a.rtmp.youtube.com/live2/' },
  {
    id: 'facebook',
    name: 'Facebook Live',
    url: 'rtmps://live-api-s.facebook.com:443/rtmp/',
  },
  { id: 'custom', name: 'Custom RTMP' },
];

export const ControlsDock: React.FC<ControlsDockProps> = ({
  setModal,
  isStreaming,
  onStartStream,
  onStopStream,
  rtmpUrl,
  isRecording,
  onStartRecording,
  onStopRecording,
  isPaused,
  onPauseRecording,
  onResumeRecording,
  onExit,
}) => {
  const [showProviders, setShowProviders] = React.useState(false);

  const buttonClass =
    'w-full py-2 rounded text-sm font-medium transition-colors border shadow-sm';
  const primaryClass =
    'bg-blue-600 hover:bg-blue-700 text-white border-transparent';
  const dangerClass =
    'bg-red-600 hover:bg-red-700 text-white border-transparent';
  const secondaryClass =
    'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';

  const handleStartStream = (provider: StreamingProvider) => {
    onStartStream(provider);
    setShowProviders(false);
  };

  return (
    <div className="p-2 h-full flex flex-col gap-2 relative">
      {!isStreaming ? (
        <div className="relative">
          <button
            className={`${buttonClass} ${primaryClass} flex items-center justify-center gap-2`}
            onClick={() => setShowProviders(!showProviders)}
          >
            Start Streaming
            <ChevronDown size={14} />
          </button>

          {showProviders && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-[100] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-between group"
                  onClick={() => handleStartStream(p)}
                >
                  {p.name}
                  {p.id === 'custom' && rtmpUrl && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                      {rtmpUrl}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          className={`${buttonClass} ${dangerClass}`}
          onClick={onStopStream}
        >
          Stop Streaming
        </button>
      )}
      {!isRecording ? (
        <button
          className={`${buttonClass} ${secondaryClass}`}
          onClick={onStartRecording}
        >
          Start Recording
        </button>
      ) : (
        <div className="flex gap-1">
          <button
            className={`flex-grow ${buttonClass} ${dangerClass}`}
            onClick={onStopRecording}
          >
            Stop Rec
          </button>
          {isPaused ? (
            <button
              className={`flex-grow ${buttonClass} ${primaryClass}`}
              onClick={onResumeRecording}
            >
              Resume
            </button>
          ) : (
            <button
              className={`flex-grow ${buttonClass} ${secondaryClass}`}
              onClick={onPauseRecording}
            >
              Pause
            </button>
          )}
        </div>
      )}
      <div className="flex-grow"></div>
      <div className="flex gap-2">
        <button
          className={`flex-grow py-2 rounded text-sm font-medium transition-colors border shadow-sm ${secondaryClass}`}
          onClick={() => setModal(ModalType.SETTINGS)}
        >
          Settings
        </button>
        <button
          className={`flex-grow py-2 rounded text-sm font-medium transition-colors border shadow-sm ${secondaryClass}`}
          onClick={() => setModal(ModalType.RECORDINGS)}
        >
          Recordings
        </button>
        <button
          className={`flex-grow py-2 rounded text-sm font-medium transition-colors border shadow-sm ${secondaryClass}`}
          onClick={onExit}
        >
          Exit
        </button>
      </div>
    </div>
  );
};
