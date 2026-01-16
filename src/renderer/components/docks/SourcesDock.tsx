import React from 'react';
import {
  Plus,
  Minus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Image as ImageIcon,
  Video,
  Globe,
  Mic,
  Camera,
  Settings,
} from 'lucide-react';
import { Source, ModalType } from '../../types';

interface SourcesDockProps {
  sources: Source[];
  onAddSource?: () => void;
  onDeleteSource: (id: string) => void;
  onRenameSource: (id: string, newName: string) => void;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSetBackground: (id: string) => void;
  setModal?: (type: ModalType) => void;
}

export const SourcesDock: React.FC<SourcesDockProps> = ({
  sources,
  onAddSource,
  onDeleteSource,
  onRenameSource,
  selectedSourceId,
  onSelectSource,
  onToggleVisibility,
  onToggleLock,
  onSetBackground,
  setModal,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  const handleStartEdit = (source: Source) => {
    setEditingId(source.id);
    setEditName(source.name);
  };

  const handleFinishEdit = () => {
    if (editingId && editName.trim()) {
      onRenameSource(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const getIcon = (type: Source['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={14} />;
      case 'video':
        return <Video size={14} />;
      case 'browser':
        return <Globe size={14} />;
      case 'audio':
        return <Mic size={14} />;
      case 'camera':
        return <Camera size={14} />;
      default:
        return <ImageIcon size={14} />;
    }
  };

  const handleEditSource = () => {
    if (selectedSourceId && setModal) {
      setModal(ModalType.EDIT_SOURCE);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-1 space-y-0.5">
        {sources.map((source) => (
          <div
            key={source.id}
            onClick={() => onSelectSource(source.id)}
            onDoubleClick={() => handleStartEdit(source)}
            className={`flex items-center px-3 py-2 text-sm rounded cursor-pointer group select-none transition-colors ${
              selectedSourceId === source.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div
              className={`mr-2 ${selectedSourceId === source.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {getIcon(source.type)}
            </div>

            {editingId === source.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleFinishEdit}
                onKeyDown={handleKeyDown}
                className="flex-grow bg-white text-black px-1 rounded outline-none border border-blue-300 h-5 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-grow truncate">{source.name}</span>
            )}

            <div
              className={`flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ${selectedSourceId === source.id ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <button
                className="hover:text-gray-900 dark:hover:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(source.id);
                }}
              >
                {source.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                className="hover:text-gray-900 dark:hover:text-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(source.id);
                }}
              >
                {source.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="h-8 border-t border-gray-200 dark:border-gray-700 flex items-center px-2 space-x-1 shrink-0 bg-gray-50 dark:bg-gray-800 transition-colors">
        <button
          onClick={onAddSource}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => selectedSourceId && onDeleteSource(selectedSourceId)}
          className={`p-1 rounded ${selectedSourceId ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white' : 'text-gray-400 dark:text-gray-600 cursor-default'}`}
        >
          <Minus size={14} />
        </button>
        <div className="flex-grow" />
        <button
          onClick={() => selectedSourceId && onSetBackground(selectedSourceId)}
          className={`p-1 rounded ${selectedSourceId ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white' : 'text-gray-400 dark:text-gray-600 cursor-default'}`}
          title="Set as Background"
        >
          <ImageIcon size={14} />
        </button>
        <button
          onClick={handleEditSource}
          className={`p-1 rounded ${selectedSourceId ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white' : 'text-gray-400 dark:text-gray-600 cursor-default'}`}
          title="Edit Source"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
};
