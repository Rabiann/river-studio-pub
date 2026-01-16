import React, { useEffect, useState } from 'react';
import {
  X,
  Monitor,
  Image as ImageIcon,
  Camera,
  ArrowLeft,
  Video,
  Type,
} from 'lucide-react';
import { ScreenSource, Source } from '../../types';

interface AddSourceModalProps {
  onClose: () => void;
  onSourceAdded: (source: Source) => void;
}

type SourceType = 'window' | 'image' | 'camera' | 'audio' | 'video' | 'text';

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
  onClose,
  onSourceAdded,
}) => {
  const [step, setStep] = useState<'type-selection' | 'source-selection'>(
    'type-selection'
  );
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [sources, setSources] = useState<ScreenSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(40);
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [fontFamily, setFontFamily] = useState('Arial');

  const [focusedType, setFocusedType] = useState<SourceType>('window');

  const SOURCE_TYPES: {
    id: SourceType;
    label: string;
    icon: React.ElementType;
    description: string;
    color: string;
    bgColor: string;
  }[] = [
      {
        id: 'window',
        label: 'Window Capture',
        icon: Monitor,
        description:
          'Capture a specific window or application from your desktop.',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      },
      {
        id: 'image',
        label: 'Image',
        icon: ImageIcon,
        description: 'Add an image file (PNG, JPG, GIF, etc.) to your scene.',
        color: 'text-purple-500',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      },
      {
        id: 'video',
        label: 'Video File',
        icon: Video,
        description: 'Play a video file (MP4, WEBM, etc.) in your scene.',
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
      },
      {
        id: 'camera',
        label: 'Webcam',
        icon: Camera,
        description: 'Capture video from webcam.',
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
      },
      {
        id: 'audio',
        label: 'Audio Input',
        icon: Monitor,
        description: 'Add an audio input device like a microphone.',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      },
      {
        id: 'text',
        label: 'Text',
        icon: Type,
        description: 'Add a text label or heading to your scene.',
        color: 'text-gray-500 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
      },
    ];

  useEffect(() => {
    if (step === 'source-selection' && selectedType === 'window') {
      loadScreenSources();
    }
  }, [step, selectedType]);

  const loadScreenSources = async () => {
    setLoading(true);
    try {
      const sources = await window.electronAPI.getScreenSources();
      setSources(sources);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: SourceType) => {
    setSelectedType(type);
    if (type === 'image') {
      handleImageSelect();
    } else if (type === 'video') {
      handleVideoSelect();
    } else if (type === 'camera') {
      handleAddCamera();
    } else if (type === 'audio') {
      handleAddAudio();
    } else if (type === 'text') {
      setStep('source-selection'); // Reuse step for text input
    } else {
      setStep('source-selection');
    }
  };

  const handleAddAudio = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const id = `mic-${Date.now()}`;
      // Audio doesn't need to be added to scene visually, but we might want to track it
      // For now, we just add it to sources
      onSourceAdded({
        id,
        name: 'Microphone',
        type: 'audio',
        visible: true,
        locked: false,
        sceneId: '1',
        data: { deviceId: 'default' }, // We could select device
      });
      onClose();
    } catch (e) {
      console.error('Failed to add audio', e);
      alert('Failed to access microphone');
    }
  };

  const handleAddCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      const id = `cam-${Date.now()}`;
      window.addSceneVideo(id, stream);
      onSourceAdded({
        id,
        name: 'Webcam',
        type: 'camera',
        visible: true,
        locked: false,
        sceneId: '1', // Will be overwritten by App
        data: { deviceId: stream.id },
      });
      onClose();
    } catch (e: unknown) {
      console.error('Failed to add camera', e);
      let reason = 'Unknown reason';
      const err = e as { name?: string; message?: string };
      if (err?.name) {
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            reason = 'Permission denied. Please check your system settings.';
            break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            reason = 'No camera found.';
            break;
          case 'NotReadableError':
          case 'TrackStartError':
            reason = 'Camera is likely in use by another application.';
            break;
          case 'OverconstrainedError':
          case 'ConstraintNotSatisfiedError':
            reason = 'Camera capabilities not supported.';
            break;
          default:
            reason = err.message || err.name;
        }
      } else if (err?.message) {
        reason = err.message;
      } else if (typeof e === 'string') {
        reason = e;
      }

      alert(`Failed to access webcam: ${reason}`);
    }
  };

  const handleImageSelect = async () => {
    try {
      const filePath = await window.electronAPI.selectFile([
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
      ]);
      if (filePath) {
        const objectUrl = `file://${filePath}`;
        const id = `img-${Date.now()}`;
        const fileName = filePath.split(/[/\\]/).pop() || 'Image';

        window.addSceneImage(id, objectUrl);
        onSourceAdded({
          id,
          name: fileName,
          type: 'image',
          visible: true,
          locked: false,
          sceneId: '1',
          data: { url: objectUrl },
        });
        onClose();
      }
    } catch (e) {
      console.error('Failed to select image', e);
    }
  };

  const handleVideoSelect = async () => {
    try {
      const filePath = await window.electronAPI.selectFile([
        { name: 'Videos', extensions: ['mp4', 'webm', 'mkv', 'avi'] },
      ]);
      if (filePath) {
        const objectUrl = `file://${filePath}`;
        const id = `vid-${Date.now()}`;
        const fileName = filePath.split(/[/\\]/).pop() || 'Video';

        window.addSceneVideoFile(id, objectUrl);
        onSourceAdded({
          id,
          name: fileName,
          type: 'video',
          visible: true,
          locked: false,
          sceneId: '1',
          data: { url: objectUrl },
        });
        onClose();
      }
    } catch (e) {
      console.error('Failed to select video', e);
    }
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const id = `txt-${Date.now()}`;
    const options = {
      color: textColor,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      fontFamily: fontFamily,
    };

    window.addSceneText(id, textInput, options);

    onSourceAdded({
      id,
      name: `Text: ${textInput.substring(0, 10)}...`,
      type: 'text',
      visible: true,
      locked: false,
      sceneId: '1',
      text: textInput,
      color: textColor,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      fontFamily: fontFamily,
    });
    onClose();
  };

  const handleScreenSourceSelect = async (sourceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720,
          },
        } as unknown as MediaTrackConstraints,
      });

      window.addSceneVideo(sourceId, stream);

      const selectedSource = sources.find((s) => s.id === sourceId);
      if (selectedSource) {
        onSourceAdded({
          id: selectedSource.id,
          name: selectedSource.name,
          type: 'window',
          visible: true,
          locked: false,
          sceneId: '1',
          data: { sourceId: selectedSource.id },
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to add source:', error);
      alert('Failed to add source');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {step === 'source-selection' && (
              <button
                onClick={() => setStep('type-selection')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {step === 'type-selection'
                ? 'Add Source'
                : selectedType === 'window'
                  ? 'Select Window'
                  : 'Enter Text'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {step === 'type-selection' && (
            <div className="flex flex-row h-[400px]">
              {/* Left Side - Source List */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 pr-4 overflow-y-auto">
                <div className="space-y-1">
                  {SOURCE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onMouseEnter={() => setFocusedType(type.id)}
                      className={`w-full text-left px-4 py-3 rounded-md transition-colors font-medium flex items-center justify-between group ${focusedType === type.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                      <span>{type.label}</span>
                      {focusedType === type.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side - Details */}
              <div className="w-2/3 pl-6 flex flex-col items-center justify-center text-center p-8">
                {SOURCE_TYPES.map((type) => {
                  if (type.id !== focusedType) return null;
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      className="animate-in fade-in zoom-in duration-200 flex flex-col items-center max-w-sm"
                    >
                      <div className={`p-6 rounded-2xl mb-6 ${type.bgColor}`}>
                        <Icon size={64} className={type.color} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {type.label}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        {type.description}
                      </p>

                      <button
                        onClick={() => handleTypeSelect(type.id)}
                        className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
                      >
                        Add {type.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'source-selection' && selectedType === 'text' && (
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text Content
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hello World"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-9 w-9 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Weight
                  </label>
                  <select
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="100">Thin</option>
                    <option value="300">Light</option>
                    <option value="500">Medium</option>
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Font Style
                  </label>
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Impact">Impact</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                </select>
              </div>

              <button
                onClick={handleAddText}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mt-4"
              >
                Add Text
              </button>
            </div>
          )}

          {step === 'source-selection' && selectedType === 'window' && (
            <>
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading sources...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      onClick={() => handleScreenSourceSelect(source.id)}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors flex flex-col items-center gap-2 group"
                    >
                      <div className="w-full aspect-video bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center text-gray-400">
                        {source.thumbnail ? (
                          <img
                            src={source.thumbnail}
                            alt={source.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Monitor size={48} />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {source.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!loading && sources.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No sources found.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
