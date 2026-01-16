import React from 'react';

interface ExitConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  onClose,
  onConfirm,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-80 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Exit Studio?
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to exit? Any unsaved changes or active streams
          will be stopped.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded shadow-sm"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
};
