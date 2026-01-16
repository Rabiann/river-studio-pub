import React, { useEffect, useRef } from 'react';
import { Scene } from '../classes/Scene';
import { Source } from '../types';
import { AudioEngine } from '../classes/AudioEngine';

interface PreviewAreaProps {
  sources: Source[];
  onDeleteSource: (id: string) => void;
  onSelectSource: (id: string | null) => void;
  selectedSourceId?: string | null;
  activeSceneId: string;
  transitionType: 'cut' | 'fade';
  transitionDuration: number;
  audioEngine: AudioEngine | null;
  onUpdateSource: (id: string, updates: Partial<Source>) => void;
}


export const PreviewArea: React.FC<PreviewAreaProps> = ({
  sources,
  onDeleteSource,
  onSelectSource,
  selectedSourceId,
  activeSceneId,
  transitionType,
  transitionDuration,
  audioEngine,
  onUpdateSource,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const pendingIds = useRef(new Set<string>());
  const audioEngineRef = useRef(audioEngine);

  useEffect(() => {
    audioEngineRef.current = audioEngine;
  }, [audioEngine]);

  const activeSceneIdRef = useRef(activeSceneId);

  useEffect(() => {
    activeSceneIdRef.current = activeSceneId;
    if (sceneRef.current) {
      // Use transitionToScene instead of setScene
      sceneRef.current.transitionToScene(
        activeSceneId,
        transitionType,
        transitionDuration
      );
    }
  }, [activeSceneId, transitionType, transitionDuration]);

  // Initialize Scene
  useEffect(() => {
    if (canvasRef.current && !sceneRef.current) {
      sceneRef.current = new Scene(canvasRef.current, activeSceneId);

      // Expose functions globally
      window.addSceneImage = (
        id: string,
        url: string,
        props?: Partial<Source>
      ) => {
        if (pendingIds.current.has(id) || sceneRef.current?.getElementById(id))
          return;
        pendingIds.current.add(id);

        const img = new Image();
        img.onload = () => {
          const tempSource: Source = {
            id,
            name: 'Image',
            type: 'image',
            visible: true,
            locked: false,
            sceneId: activeSceneIdRef.current, // Use ref
            ...props,
          };
          sceneRef.current?.addSource(tempSource, img);
          pendingIds.current.delete(id);
        };
        img.onerror = () => pendingIds.current.delete(id);
        img.src = url;
      };

      window.addSceneVideo = (
        id: string,
        stream: MediaStream,
        props?: Partial<Source>
      ) => {
        if (pendingIds.current.has(id) || sceneRef.current?.getElementById(id))
          return;
        pendingIds.current.add(id);

        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;

        video.onloadedmetadata = () => {
          video.play();
          const tempSource: Source = {
            id,
            name: 'Video',
            type: 'video',
            visible: true,
            locked: false,
            sceneId: activeSceneIdRef.current, // Use ref
            ...props,
          };
          sceneRef.current?.addSource(tempSource, video);
          pendingIds.current.delete(id);
        };
        video.onerror = () => pendingIds.current.delete(id);
      };

      window.addSceneVideoFile = (
        id: string,
        url: string,
        props?: Partial<Source>
      ) => {
        if (pendingIds.current.has(id) || sceneRef.current?.getElementById(id))
          return;
        pendingIds.current.add(id);

        const video = document.createElement('video');
        video.src = url;
        video.loop = true;
        video.autoplay = true;
        video.muted = false; // Must be false to capture audio, but we'll route it
        video.crossOrigin = 'anonymous'; // Important for capturing

        video.onloadedmetadata = () => {
          video
            .play()
            .then(() => {
              // Add to AudioEngine with monitoring
              // We use the element directly to hijack audio
              console.log(`🔊 Video ${id} playing, adding to AudioEngine...`);
              audioEngineRef.current?.addInput(id, video, { monitor: true });
            })
            .catch((e) => console.error('Video play failed', e));

          const tempSource: Source = {
            id,
            name: 'Video File',
            type: 'video',
            visible: true,
            locked: false,
            sceneId: activeSceneIdRef.current,
            ...props,
          };
          sceneRef.current?.addSource(tempSource, video);
          pendingIds.current.delete(id);
        };
        video.onerror = () => pendingIds.current.delete(id);
      };

      window.addSceneText = (
        id: string,
        text: string,
        options = {},
        props?: Partial<Source>
      ) => {
        if (pendingIds.current.has(id) || sceneRef.current?.getElementById(id))
          return;

        const tempSource: Source = {
          id,
          name: 'Text',
          type: 'text',
          visible: true,
          locked: false,
          sceneId: activeSceneIdRef.current,
          text,
          color: options.color || '#ffffff',
          fontSize: options.fontSize || 40,
          fontWeight: options.fontWeight,
          fontStyle: options.fontStyle,
          ...props,
        };
        sceneRef.current?.addSource(tempSource, null);
      };

      window.getSceneStream = () => {
        if (canvasRef.current) {
          return canvasRef.current.captureStream(30);
        }
        throw new Error('Canvas not initialized');
      };
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.destroy();
        sceneRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Separate effect for updating callbacks
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.onSourceRemoved = (id) => {
        // Only remove from audioEngine, do NOT call onDeleteSource here
        // as this callback can be triggered by scene switching/cleanup
        audioEngine?.removeInput(id);
      };
      sceneRef.current.onSourceSelected = (id) => {
        onSelectSource(id);
      };
      sceneRef.current.onSourceUpdated = (id, updates) => {
        onUpdateSource(id, updates);
      };
    }
  }, [onDeleteSource, onSelectSource, onUpdateSource, audioEngine]);

  // Sync sources from props to Scene
  useEffect(() => {
    if (!sceneRef.current) return;

    // Filter sources by active scene ID
    const activeSceneSources = sources.filter(
      (s) => s.sceneId === activeSceneId
    );

    activeSceneSources.forEach((source) => {
      if (pendingIds.current.has(source.id)) return;

      const existing = sceneRef.current?.getElementById(source.id);
      if (existing) {
        // Update existing
        sceneRef.current?.updateSource(source.id, source);
      } else {
        // Add new source (e.g., from import)
        // We need to recreate the source based on its type
        if (source.type === 'image' && source.data?.url) {
          window.addSceneImage(source.id, source.data.url, source);
        } else if (source.type === 'video' && source.data?.url) {
          window.addSceneVideoFile(source.id, source.data.url, source);
        } else if (source.type === 'text' && source.text) {
          window.addSceneText(
            source.id,
            source.text,
            {
              color: source.color,
              fontSize: source.fontSize,
              fontWeight: source.fontWeight,
              fontStyle: source.fontStyle,
            },
            source
          );
        } else if (source.type === 'window' && source.data?.sourceId) {
          // Attempt to restore window capture
          navigator.mediaDevices
            .getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: source.data.sourceId,
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720,
                },
              } as unknown as MediaTrackConstraints,
            })
            .then((stream) => {
              window.addSceneVideo(source.id, stream, source);
            })
            .catch((e) => {
              console.error('Failed to restore window source', e);
              // Add placeholder or keep it empty but present in list
              // For now, we just don't add it to the scene canvas, but it remains in the source list
            });
        } else if (source.type === 'audio' && source.data?.deviceId) {
          // Restore audio input
          navigator.mediaDevices
            .getUserMedia({
              audio: { deviceId: { exact: source.data.deviceId } },
              video: false,
            })
            .then((stream) => {
              audioEngine?.addInput(source.id, stream);
            })
            .catch((e) => {
              console.error('Failed to restore audio source', e);
              // Fallback to default mic if specific device fails?
              // For now, just log error
            });
        }
        // Note: For window captures, we can't restore the stream from JSON
        // The user will need to re-add window captures after import
      }
    });

    // Handle removals (if source is in Scene but not in active scene sources)
    // This handles deletion from SourcesDock and scene switching
    if (sceneRef.current) {
      sceneRef.current.elements.forEach((el) => {
        // Only remove if NOT in global sources (truly deleted)
        // If it's just not in activeSceneSources, the scene switch handles it visually
        if (!sources.find((s) => s.id === el.id)) {
          sceneRef.current?.removeSource(el.id);
          audioEngine?.removeInput(el.id);
        }
      });
    }
  }, [sources, activeSceneId, audioEngine]);

  // Sync selection
  useEffect(() => {
    if (sceneRef.current && selectedSourceId !== undefined) {
      sceneRef.current.selectSource(selectedSourceId);
      if (selectedSourceId) {
        sceneRef.current.bringToFront(selectedSourceId);
      }
    }
  }, [selectedSourceId]);

  return (
    <div className="flex-grow bg-gray-100 dark:bg-gray-900 p-8 flex items-center justify-center overflow-hidden relative transition-colors duration-200">
      <div className="aspect-video w-full max-w-5xl bg-black rounded-lg shadow-2xl relative overflow-hidden group border border-gray-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    </div>
  );
};
