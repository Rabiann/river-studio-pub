import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, EyeOff, Trash2, Plus, Key } from 'lucide-react';
import { TabID } from '../../types';

interface SettingsModalProps {
  onClose: () => void;
  rtmpUrl: string;
  setRtmpUrl: (url: string) => void;
  recordingPath: string;
  setRecordingPath: (path: string) => void;
  recordingFormat: 'webm' | 'mp4' | 'mkv';
  setRecordingFormat: (format: 'webm' | 'mp4' | 'mkv') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  rtmpUrl,
  setRtmpUrl,
  recordingPath,
  setRecordingPath,
  recordingFormat,
  setRecordingFormat,
  theme,
  setTheme,

}) => {
  const [activeTab, setActiveTab] = useState<TabID | 'appearance'>(
    'appearance'
  );
  const [showKey, setShowKey] = useState(false);
  const [localRtmpUrl, setLocalRtmpUrl] = useState(rtmpUrl);
  const [localRecordingPath, setLocalRecordingPath] = useState(recordingPath);
  const [localRecordingFormat, setLocalRecordingFormat] =
    useState(recordingFormat);
  const [localTheme, setLocalTheme] = useState(theme);
  const [localService, setLocalService] = useState('Custom...');


  // Token management state
  const [tokens, setTokens] = useState<
    Array<{ id: number; platform: string; token: string }>
  >([]);
  const [newPlatform, setNewPlatform] = useState('');
  const [newToken, setNewToken] = useState('');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const handleSave = async () => {
    // Persist all settings to SQLite
    try {
      const settingsToSave = {
        theme: localTheme,
        rtmpUrl: localRtmpUrl,
        recordingPath: localRecordingPath,
        recordingFormat: localRecordingFormat,
      };
      console.log('💾 Saving settings to database:', settingsToSave);
      const result = await window.electronAPI.setMultipleSettings(settingsToSave);
      console.log('✅ Settings save result:', result);
    } catch (err) {
      console.error('Failed to save settings to database:', err);
    }

    // Update parent state
    setRtmpUrl(localRtmpUrl);
    setRecordingPath(localRecordingPath);
    setRecordingFormat(localRecordingFormat);
    setTheme(localTheme);
    onClose();
  };

  const loadTokens = async () => {
    const result = await window.electronAPI.getTokens();
    if (result.success) {
      setTokens(result.tokens);
    }
  };

  // Load tokens on mount
  useEffect(() => {
    loadTokens();
  }, []);

  // Get current stream key based on selected service
  const currentStreamKey = React.useMemo(() => {
    if (localService === 'Custom...') {
      // Find 'custom' platform token if it exists
      const token = tokens.find((t) => t.platform === 'custom');
      return token?.token || '';
    }
    const token = tokens.find(
      (t) => t.platform.toLowerCase() === localService.toLowerCase()
    );
    return token?.token || '';
  }, [localService, tokens]);

  const handleAddToken = async () => {
    if (!newPlatform) {
      alert('Please select a platform');
      return;
    }
    if (!newToken) {
      alert('Please enter a stream key / token');
      return;
    }

    try {
      console.log('Attempting to create token for:', newPlatform);
      const result = await window.electronAPI.createToken(newPlatform, newToken);
      if (result.success) {
        setNewPlatform('');
        setNewToken('');
        loadTokens();
      } else {
        console.error('Failed to create token:', result.error);
        alert(`Failed to save token: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error in handleAddToken:', err);
      alert('An unexpected error occurred while saving the token');
    }
  };

  const handleDeleteToken = async (platform: string) => {
    const result = await window.electronAPI.deleteToken(platform);
    if (result.success) {
      loadTokens();
    }
  };

  const handleGetStreamKey = () => {
    let url = '';
    switch (localService) {
      case 'twitch':
        url = 'https://dashboard.twitch.tv/settings/stream';
        break;
      case 'youtube':
        url = 'https://studio.youtube.com/';
        break;
      case 'facebook':
        url = 'https://www.facebook.com/live/producer/';
        break;
      default:
        return;
    }
    if (url) {
      window.electronAPI.openExternal(url);
    }
  };

  const tabs: { id: TabID | 'appearance'; label: string; icon?: string }[] = [
    { id: 'appearance', label: 'Appearance' },
    { id: 'stream', label: 'Stream' },
    { id: 'output', label: 'Output' },

    { id: 'tokens', label: 'Platform Tokens' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-[900px] h-[650px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Stream Settings
          </h2>
          {/* Close button handled by bottom buttons in designs, but typically handy here too */}
        </div>

        <div className="flex flex-grow overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-grow p-8 overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                    Theme
                  </label>
                  <div className="col-span-3 flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={localTheme === 'light'}
                        onChange={() => setLocalTheme('light')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Light
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={localTheme === 'dark'}
                        onChange={() => setLocalTheme('dark')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Dark
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'stream' && (
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 text-right">
                    Service
                  </label>
                  <div className="col-span-3">
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      value={localService}
                      onChange={(e) => setLocalService(e.target.value)}
                    >
                      <option>Custom...</option>
                      <option value="twitch">Twitch</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook Live</option>
                    </select>
                  </div>
                </div>

                {localService === 'Custom...' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 text-right">
                      Server
                    </label>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="rtmp://..."
                        value={localRtmpUrl}
                        onChange={(e) => setLocalRtmpUrl(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Used when &quot;Custom RTMP&quot; is selected from the Start
                        Streaming menu.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 my-4"></div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 text-right">
                    Stream Key
                  </label>
                  <div className="col-span-3 flex space-x-2">
                    <div className="relative flex-grow">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={currentStreamKey}
                        readOnly
                        placeholder={
                          currentStreamKey
                            ? ''
                            : 'No key found. Add one in "Platform Tokens" tab'
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm pr-10 bg-gray-50 dark:bg-gray-700 focus:outline-none text-gray-900 dark:text-white"
                      />
                      <button
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleGetStreamKey}
                      disabled={localService === 'Custom...'}
                    >
                      Get Stream Key
                    </button>
                  </div>
                </div>

                {/* Warning Box */}
                <div className="col-start-2 col-span-4 ml-[25%]">
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-start space-x-3">
                    <AlertTriangle
                      className="text-orange-500 shrink-0 mt-0.5"
                      size={18}
                    />
                    <div>
                      <h4 className="text-orange-800 dark:text-orange-300 text-sm font-semibold">
                        Security Warning
                      </h4>
                      <p className="text-orange-700 dark:text-orange-400 text-xs mt-1 leading-relaxed">
                        Never share your stream key with anyone or show it on
                        stream. Anyone with this key can stream to your channel.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'output' && (
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                    Recording Path
                  </label>
                  <div className="col-span-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="/Users/username/Videos"
                        value={localRecordingPath}
                        onChange={(e) => setLocalRecordingPath(e.target.value)}
                        className="flex-grow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={async () => {
                          const path = await window.electronAPI.selectDirectory();
                          if (path) {
                            setLocalRecordingPath(path);
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Browse
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty to choose location for each recording
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 text-right">
                    Recording Format
                  </label>
                  <div className="col-span-3">
                    <select
                      value={localRecordingFormat}
                      onChange={(e) =>
                        setLocalRecordingFormat(e.target.value as 'webm' | 'mp4' | 'mkv')
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                    >
                      <option value="webm">WebM</option>
                      <option value="mp4">MP4</option>
                      <option value="mkv">MKV</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'tokens' && (
              <div className="space-y-6 max-w-2xl">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Key className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-blue-800 dark:text-blue-300 text-sm font-semibold">
                        Secure Token Storage
                      </h4>
                      <p className="text-blue-700 dark:text-blue-400 text-xs mt-1 leading-relaxed">
                        Tokens are encrypted and stored securely on your device.
                        They will be used for streaming to the selected
                        platform.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Add New Token */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    Add New Platform Token
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Platform
                      </label>
                      <select
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      >
                        <option value="">Select Platform...</option>
                        <option value="twitch">Twitch</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook Live</option>
                        <option value="custom">Custom RTMP</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Stream Key / Token
                      </label>
                      <input
                        type="password"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        placeholder="Enter your stream key or token"
                        className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={handleAddToken}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Add Token</span>
                    </button>
                  </div>
                </div>

                {/* Token List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Saved Tokens
                  </h3>
                  {tokens.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm italic">
                      No tokens saved yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tokens.map((token) => (
                        <div
                          key={token.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800 flex items-center justify-between"
                        >
                          <div className="flex-grow">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                              {token.platform}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type={
                                  showTokens[token.platform]
                                    ? 'text'
                                    : 'password'
                                }
                                value={token.token}
                                readOnly
                                className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono w-64"
                              />
                              <button
                                onClick={() =>
                                  setShowTokens((prev) => ({
                                    ...prev,
                                    [token.platform]: !prev[token.platform],
                                  }))
                                }
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showTokens[token.platform] ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteToken(token.platform)}
                            className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div >
  );
};
