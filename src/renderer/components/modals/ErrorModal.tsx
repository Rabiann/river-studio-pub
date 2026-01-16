import React from 'react';

interface ErrorModalProps {
    message: string;
    onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[400px] max-w-full animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Streaming Error
                    </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 break-words">
                    {message}
                </p>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
