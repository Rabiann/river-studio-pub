import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  Play,
  RefreshCw,
  Trash2,
  HardDrive,
} from 'lucide-react';
import { Recording } from '../../types';

interface RecordingsModalProps {
  onClose: () => void;
}

export const RecordingsModal: React.FC<RecordingsModalProps> = ({
  onClose,
}) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedRec = recordings.find((r) => r.id === selectedId) || null;

  const fetchRecordings = async () => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.getRecordings();
      setRecordings(data);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const handleDelete = async () => {
    if (selectedId) {
      if (
        confirm(
          'Are you sure you want to delete this recording? This cannot be undone.'
        )
      ) {
        const success = await window.electronAPI.deleteRecording(selectedId);
        if (success) {
          setRecordings((prev) => prev.filter((r) => r.id !== selectedId));
          setSelectedId(null);
        } else {
          alert('Failed to delete recording');
        }
      }
    }
  };

  const handleOpenFile = async () => {
    if (selectedId) {
      await window.electronAPI.openRecording(selectedId);
    }
  };

  const handleOpenFolder = async () => {
    await window.electronAPI.openRecordingFolder(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-8">
      <div className="bg-white dark:bg-gray-800 w-full max-w-6xl h-full max-h-[800px] rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <div className="flex items-baseline space-x-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recordings
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {recordings.length} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-grow max-w-2xl">
            <Folder size={18} className="text-yellow-500" />
            <div
              className="text-sm text-gray-600 dark:text-gray-300 truncate bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded w-full flex justify-between items-center hover:border-blue-400 cursor-pointer transition-colors"
              onClick={handleOpenFolder}
            >
              <span className="truncate">
                {selectedRec
                  ? selectedRec.path
                  : 'Select a recording to view path'}
              </span>
              <span className="text-xs font-semibold text-gray-400 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                Browse
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchRecordings}
              className="p-1.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Grid */}
          <div className="flex-grow overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Loading recordings...
              </div>
            ) : recordings.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No recordings found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedId(rec.id)}
                    className={`group rounded-lg overflow-hidden border transition-all cursor-pointer ${selectedId === rec.id
                      ? 'ring-2 ring-blue-500 border-transparent shadow-lg transform scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                  >
                    <div className="aspect-video bg-gray-200 relative">
                      {rec.thumbnail ? (
                        <img
                          src={rec.thumbnail}
                          alt={rec.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                          <VideoIcon size={32} />
                        </div>
                      )}

                      {selectedId === rec.id && (
                        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center"></div>
                      )}
                    </div>
                    <div className="p-3">
                      <div
                        className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mb-1"
                        title={rec.filename}
                      >
                        {rec.filename}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{rec.date}</span>
                        <span>{rec.size}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Details */}
          {selectedRec && (
            <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
              {/* Preview Player Placeholder */}
              <div className="aspect-video bg-black rounded-lg mb-6 relative group overflow-hidden shadow-md">
                {selectedRec.thumbnail && (
                  <img
                    src={selectedRec.thumbnail}
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors cursor-pointer"
                    onClick={handleOpenFile}
                  >
                    <Play size={32} className="text-white fill-white ml-1" />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white break-all mb-4 leading-tight">
                {selectedRec.filename}
              </h3>

              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center space-x-1.5">
                  <HardDrive size={16} />
                  <span>{selectedRec.size}</span>
                </div>
              </div>

              <button
                onClick={handleOpenFile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg mb-4"
              >
                <Play size={18} fill="currentColor" />
                Open File
              </button>

              <div className="grid grid-cols-2 gap-2 mb-auto">
                <button
                  onClick={handleOpenFolder}
                  className="flex items-center justify-center py-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  title="Open Folder"
                >
                  <Folder size={18} />
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <button
                  onClick={handleDelete}
                  className="w-full text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <Trash2 size={16} />
                  Delete Recording
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span>
            Total Recordings:{' '}
            <strong className="text-gray-900 dark:text-white">
              {recordings.length}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

const VideoIcon = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 10l5-5v14l-5-5" />
    <rect x="2" y="6" width="13" height="12" rx="2" ry="2" />
  </svg>
);
