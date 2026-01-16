import React, { useState, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { PreviewArea } from './components/PreviewArea';
import { BottomDocks } from './components/BottomDocks';
import { SettingsModal } from './components/modals/SettingsModal';
import { RecordingsModal } from './components/modals/RecordingsModal';
import { ModalType, Source, Scene, StreamingProvider } from './types';
import { AudioEngine } from './classes/AudioEngine';

import { AddSourceModal } from './components/modals/AddSourceModal';
import { ExitConfirmationModal } from './components/modals/ExitConfirmationModal';
import { EditSourceModal } from './components/modals/EditSourceModal';
import { ErrorModal } from './components/modals/ErrorModal';

function App() {
  const [scenes, setScenes] = useState<Scene[]>([{ id: '1', name: 'Scene 1' }]);
  const [activeSceneId, setActiveSceneId] = useState<string>('1');
  const [modalType, setModalType] = useState<ModalType>(ModalType.NONE);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [bitrate, setBitrate] = useState<number>(0);

  // Filter sources for active scene
  const activeSources = sources.filter((s) => s.sceneId === activeSceneId);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [selectedProvider, setSelectedProvider] =
    useState<StreamingProvider | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingRef = useRef<MediaRecorder | null>(null);

  // Track start times for status indicators
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null);

  // Transition state
  const [transitionType, setTransitionType] = useState<'cut' | 'fade'>('cut');
  const [transitionDuration, setTransitionDuration] = useState(300);

  // Settings state - loaded from SQLite database
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string>('');
  const [recordingFormat, setRecordingFormat] = useState<
    'webm' | 'mp4' | 'mkv'
  >('webm');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');


  // Load settings from SQLite on startup
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        /**
         * Load persistent settings from the SQLite database.
         */
        const result = await window.electronAPI.getSettings();
        if (result.success && result.settings) {
          const s = result.settings;
          setTheme((s.theme as 'light' | 'dark') || 'dark');
          setRtmpUrl(s.rtmpUrl || '');
          setRecordingPath(s.recordingPath || '');
          setRecordingFormat((s.recordingFormat as 'webm' | 'mp4' | 'mkv') || 'webm');
        }
      } catch (err) {
        // Silent fail on load
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Apply theme and persist to SQLite
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Only persist after initial load to avoid overwriting with defaults
    if (settingsLoaded) {
      window.electronAPI.setSetting('theme', theme).catch(console.error);
    }
  }, [theme, settingsLoaded]);



  // Audio Engine
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [audioVolumes, setAudioVolumes] = useState<Record<string, number>>({});
  const [audioMuted, setAudioMuted] = useState<Record<string, boolean>>({});

  // Initialize Audio Engine
  React.useEffect(() => {
    audioEngineRef.current = new AudioEngine();

    // Add microphone input automatically
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        audioEngineRef.current?.addInput('mic', stream);
        setAudioVolumes((prev) => ({ ...prev, mic: 1 }));
      })
      .catch((err) => console.error('Failed to get microphone', err));

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleAudioVolumeChange = (id: string, vol: number) => {
    setAudioVolumes((prev) => ({ ...prev, [id]: vol }));
    if (!audioMuted[id]) {
      audioEngineRef.current?.setVolume(id, vol);
    }
  };

  const handleAudioMuteToggle = (id: string) => {
    setAudioMuted((prev) => {
      const newMuted = !prev[id];
      const vol = audioVolumes[id] ?? 1;
      audioEngineRef.current?.setVolume(id, newMuted ? 0 : vol);
      return { ...prev, [id]: newMuted };
    });
  };

  const closeModal = () => setModalType(ModalType.NONE);

  const handleAddSource = (newSource: Source) => {
    // Ensure sceneId is set to active scene
    const sourceWithScene = { ...newSource, sceneId: activeSceneId };
    setSources((prev) => [...prev, sourceWithScene]);
  };

  const handleDeleteSource = (sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  };

  const handleUpdateSource = (sourceId: string, updates: Partial<Source>) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, ...updates } : s))
    );
  };

  const handleRenameSource = (sourceId: string, newName: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, name: newName } : s))
    );
  };

  const handleToggleVisibility = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleToggleLock = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, locked: !s.locked } : s))
    );
  };

  const handleSetBackground = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          // Toggle background status
          if (s.isBackground) {
            return { ...s, isBackground: false, locked: false };
          }
          return { ...s, isBackground: true, locked: true };
        }
        return s;
      })
    );
  };

  const handleAddScene = () => {
    const newId = (scenes.length + 1).toString();
    const newScene: Scene = { id: newId, name: `Scene ${newId}` };
    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newId);
    setSelectedSourceId(null);
  };

  const handleDeleteScene = () => {
    if (scenes.length <= 1) return; // Prevent deleting the last scene
    const newScenes = scenes.filter((s) => s.id !== activeSceneId);
    setScenes(newScenes);
    setActiveSceneId(newScenes[newScenes.length - 1].id);
    setSelectedSourceId(null);
  };

  const handleRenameScene = (sceneId: string, newName: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, name: newName } : s))
    );
  };

  const startStreaming = async (
    provider: StreamingProvider,
    customUrl?: string
  ) => {
    let finalUrl = '';

    if (provider.id === 'custom') {
      if (!customUrl && !rtmpUrl) {
        alert('Please enter RTMP URL');
        return;
      }
      finalUrl = customUrl || rtmpUrl;
    } else {
      // Get token for provider
      const result = await window.electronAPI.getToken(provider.id);
      if (result.success && result.token) {
        const tokenValue = (result.token as any).token;
        // Check if token looks like an error message (starts with "The module" or contains "Node.js version")
        if (tokenValue.includes('The module') && tokenValue.includes('Node.js version')) {
          alert(`The saved token for ${provider.name} appears to be corrupted with a system error. Please delete it and add it again in Settings -> Platform Tokens.`);
          return;
        }
        finalUrl = provider.url + tokenValue;
      } else {
        alert(
          `No token found for ${provider.name}. Please add it in Settings -> Platform Tokens.`
        );
        return;
      }
    }

    try {
      const stream = window.getSceneStream();

      // Combine video from canvas with audio from AudioEngine
      const audioStream = audioEngineRef.current?.getOutputStream();
      const tracks = [
        ...stream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : []),
      ];
      const combinedStream = new MediaStream(tracks);

      window.electronAPI.startStream(finalUrl);
      setSelectedProvider(provider);

      // Ensure AudioContext is active
      if (audioEngineRef.current) {
        await audioEngineRef.current.resume();
      }

      /**
       * Negotiate the best supported media container format.
       */
      const mimeTypes = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp8,opus',
        'video/webm; codecs=h244,opus',
        'video/webm; codecs=vp8',
        'video/webm',
      ];
      let selectedMimeType = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMimeType = m;
          break;
        }
      }

      /**
       * Initialize MediaRecorder to capture the scene and pipe it to IPC.
       */

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          event.data.arrayBuffer().then((buffer) => {
            window.electronAPI.sendStreamData(new Uint8Array(buffer));
          });
        }
      };

      mediaRecorder.start(20);
      mediaRecorderRef.current = mediaRecorder;
      setIsStreaming(true);
      setStreamStartTime(Date.now());
    } catch (e) {
      alert('Failed to start stream: ' + (e as Error).message);
    }
  };

  const stopStreaming = React.useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    window.electronAPI.stopStream();
    setIsStreaming(false);
    setStreamStartTime(null);
    setSelectedProvider(null);
    setBitrate(0);
  }, []);

  // Listen for streaming errors and bitrate
  React.useEffect(() => {
    const handleError = (error: string) => {
      setStreamingError(error);
      stopStreaming();
    };

    const handleBitrate = (kbps: number) => {
      setBitrate(kbps);
    };

    window.electronAPI.onStreamingError(handleError);
    window.electronAPI.onStreamingBitrate(handleBitrate);
    return () => {
      window.electronAPI.offStreamingError();
      window.electronAPI.offStreamingBitrate();
    };
  }, [stopStreaming]);

  const startRecording = async () => {
    try {
      /**
       * Determine the file path for the recording.
       * Uses persistent path from settings or prompts user.
       */
      let finalPath = '';

      if (recordingPath) {
        const timestamp = Date.now();
        const filename = `recording-${timestamp}.${recordingFormat}`;
        const separator = recordingPath.endsWith('/') ? '' : '/';
        const targetPath = `${recordingPath}${separator}${filename}`;

        const result = await window.electronAPI.startRecording(targetPath);

        if (result.error) {
          if (result.error === 'DIRECTORY_NOT_FOUND') {
            alert(`Error: The directory "${result.path}" does not exist. Please check your settings.`);
          } else {
            alert(`Failed to start recording: ${result.error}`);
          }
          return;
        }
        finalPath = result.filePath || '';
      } else {
        const result = await window.electronAPI.startRecording();
        if (result.error) {
          alert(`Failed to start recording: ${result.error}`);
          return;
        }
        finalPath = result.filePath || '';
      }

      if (!finalPath) return; // User cancelled or no path

      const stream = window.getSceneStream();

      // Combine video from canvas with audio from AudioEngine
      const audioStream = audioEngineRef.current?.getOutputStream();
      const tracks = [
        ...stream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : []),
      ];
      const combinedStream = new MediaStream(tracks);

      // Ensure AudioContext is active
      if (audioEngineRef.current) {
        await audioEngineRef.current.resume();
      }

      const mimeTypes = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp8,opus',
        'video/webm; codecs=h244,opus',
        'video/webm; codecs=vp8',
        'video/webm',
      ];
      let selectedMimeType = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMimeType = m;
          break;
        }
      }

      /**
       * Start recording with a 5Mbps bitrate for high quality.
       */
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 5000000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          event.data.arrayBuffer().then((buffer) => {
            window.electronAPI.saveRecordingChunk(new Uint8Array(buffer));
          });
        }
      };

      mediaRecorder.start(100);
      recordingRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordStartTime(Date.now());
    } catch (e) {
      alert('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      recordingRef.current.stop();
      recordingRef.current = null;
    }
    await window.electronAPI.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
    setRecordStartTime(null);
  };

  const pauseRecording = () => {
    if (recordingRef.current && recordingRef.current.state === 'recording') {
      recordingRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (recordingRef.current && recordingRef.current.state === 'paused') {
      recordingRef.current.resume();
      setIsPaused(false);
    }
  };

  const handleExportScenes = () => {
    const data = {
      scenes,
      sources,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportScenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.scenes && data.sources) {
            setScenes(data.scenes);
            setSources(data.sources);
            setActiveSceneId(data.scenes[0]?.id || '1');
          }
        } catch (err) {
          alert('Invalid scene file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    window.electronAPI.quitApp();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <TopBar
        rtmpUrl={rtmpUrl}
        setRtmpUrl={setRtmpUrl}
        isStreaming={isStreaming}
        isRecording={isRecording}
        streamStartTime={streamStartTime}
        recordStartTime={recordStartTime}
        selectedProvider={selectedProvider}
        bitrate={bitrate}
      />

      {/* Main Content Area: Preview + Docks */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Stream Preview */}
        <PreviewArea
          sources={sources}
          activeSceneId={activeSceneId}
          onDeleteSource={handleDeleteSource}
          onSelectSource={setSelectedSourceId}
          selectedSourceId={selectedSourceId}
          transitionType={transitionType}
          transitionDuration={transitionDuration}
          audioEngine={audioEngineRef.current}
          onUpdateSource={handleUpdateSource}
        />

        {/* Bottom Docking Area */}
        <BottomDocks
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneSelect={setActiveSceneId}
          onAddScene={handleAddScene}
          onDeleteScene={handleDeleteScene}
          sources={activeSources}
          onDeleteSource={handleDeleteSource}
          onRenameSource={handleRenameSource}
          selectedSourceId={selectedSourceId}
          onSelectSource={setSelectedSourceId}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onSetBackground={handleSetBackground}
          setModal={setModalType}
          isStreaming={isStreaming}
          onStartStream={startStreaming}
          onStopStream={stopStreaming}
          rtmpUrl={rtmpUrl}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          isPaused={isPaused}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onExport={handleExportScenes}
          onImport={handleImportScenes}
          onRenameScene={handleRenameScene}
          transitionType={transitionType}
          setTransitionType={setTransitionType}
          transitionDuration={transitionDuration}
          setTransitionDuration={setTransitionDuration}
          audioVolumes={audioVolumes}
          audioMuted={audioMuted}
          onAudioVolumeChange={handleAudioVolumeChange}
          onAudioMuteToggle={handleAudioMuteToggle}
          onExit={handleExit}
        />
      </div>

      {/* Modals */}
      {modalType === ModalType.SETTINGS && (
        <SettingsModal
          onClose={closeModal}
          rtmpUrl={rtmpUrl}
          setRtmpUrl={setRtmpUrl}
          recordingPath={recordingPath}
          setRecordingPath={setRecordingPath}
          recordingFormat={recordingFormat}
          setRecordingFormat={setRecordingFormat}
          theme={theme}
          setTheme={setTheme}

        />
      )}

      {modalType === ModalType.RECORDINGS && (
        <RecordingsModal onClose={closeModal} />
      )}

      {modalType === ModalType.ADD_SOURCE && (
        <AddSourceModal onClose={closeModal} onSourceAdded={handleAddSource} />
      )}

      {modalType === ModalType.EDIT_SOURCE &&
        selectedSourceId &&
        (() => {
          const sourceToEdit = sources.find((s) => s.id === selectedSourceId);
          return sourceToEdit ? (
            <EditSourceModal
              source={sourceToEdit}
              onClose={closeModal}
              onUpdate={handleUpdateSource}
            />
          ) : null;
        })()}

      {showExitConfirm && (
        <ExitConfirmationModal
          onClose={() => setShowExitConfirm(false)}
          onConfirm={handleConfirmExit}
        />
      )}

      {streamingError && (
        <ErrorModal
          message={streamingError}
          onClose={() => setStreamingError(null)}
        />
      )}
    </div>
  );
}

export default App;
