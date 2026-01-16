import React from 'react';
import {
  Plus,
  Minus,
  Download,
  Upload,
} from 'lucide-react';
import { Scene } from '../../types';

interface ScenesDockProps {
  scenes: Scene[];
  activeSceneId: string;
  onSceneSelect: (id: string) => void;
  onAddScene: () => void;
  onDeleteScene: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRenameScene: (id: string, name: string) => void;
}

export const ScenesDock: React.FC<ScenesDockProps> = ({
  scenes,
  activeSceneId,
  onSceneSelect,
  onAddScene,
  onDeleteScene,
  onExport,
  onImport,
  onRenameScene,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  const startEditing = (scene: Scene) => {
    setEditingId(scene.id);
    setEditName(scene.name);
  };

  const saveEditing = () => {
    if (editingId) {
      onRenameScene(editingId, editName);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEditing();
    if (e.key === 'Escape') setEditingId(null);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-1 space-y-0.5">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            onClick={() => onSceneSelect(scene.id)}
            onDoubleClick={() => startEditing(scene)}
            className={`px-3 py-2 text-sm rounded cursor-pointer transition-colors select-none ${activeSceneId === scene.id
                ? 'bg-blue-600 text-white font-medium'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
          >
            {editingId === scene.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={saveEditing}
                onKeyDown={handleKeyDown}
                className="w-full bg-white text-black px-1 rounded"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              scene.name
            )}
          </div>
        ))}
      </div>
      <div className="h-8 border-t border-gray-200 dark:border-gray-700 flex items-center px-2 space-x-1 shrink-0 bg-gray-50 dark:bg-gray-800 transition-colors">
        <button
          onClick={onAddScene}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={onDeleteScene}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Minus size={14} />
        </button>
        <div className="flex-grow" />
        <button
          onClick={onExport}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          title="Export Scenes"
        >
          <Download size={14} />
        </button>
        <label
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          title="Import Scenes"
        >
          <Upload size={14} />
          <input
            type="file"
            accept=".json"
            onChange={onImport}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};
