import React from 'react';
import { ScenesDock } from './docks/ScenesDock';
import { SourcesDock } from './docks/SourcesDock';
import { AudioMixerDock } from './docks/AudioMixerDock';
import { TransitionsDock } from './docks/TransitionsDock';
import { ControlsDock } from './docks/ControlsDock';
import { Scene, Source, ModalType } from '../types';

interface BottomDocksProps {
  scenes: Scene[];
  activeSceneId: string;
  onSceneSelect: (id: string) => void;
  onAddScene: () => void;
  onDeleteScene: () => void;
  sources: Source[];
  onDeleteSource: (id: string) => void;
  onRenameSource: (id: string, newName: string) => void;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSetBackground: (id: string) => void;
  setModal: (type: ModalType) => void;
  isStreaming: boolean;
  onStartStream: (provider: unknown, customUrl?: string) => void;
  onStopStream: () => void;
  rtmpUrl: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isPaused?: boolean;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRenameScene: (id: string, name: string) => void;
  transitionType: 'cut' | 'fade';
  setTransitionType: (type: 'cut' | 'fade') => void;
  transitionDuration: number;
  setTransitionDuration: (duration: number) => void;
  audioVolumes: Record<string, number>;
  audioMuted: Record<string, boolean>;
  onAudioVolumeChange: (id: string, vol: number) => void;
  onAudioMuteToggle: (id: string) => void;

  onExit: () => void;
}

const DockContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className = '' }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors duration-200 ${className}`}
  >
    <div className="bg-gray-50 dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
      {title}
    </div>
    <div className="flex-grow overflow-hidden relative">{children}</div>
  </div>
);

export const BottomDocks: React.FC<BottomDocksProps> = ({
  scenes,
  activeSceneId,
  onSceneSelect,
  onAddScene,
  onDeleteScene,
  sources,
  onDeleteSource,
  onRenameSource,
  selectedSourceId,
  onSelectSource,
  setModal,
  onToggleVisibility,
  onToggleLock,
  onSetBackground,
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
  onExport,
  onImport,
  onRenameScene,
  transitionType,
  setTransitionType,
  transitionDuration,
  setTransitionDuration,

  audioVolumes,
  audioMuted,
  onAudioVolumeChange,
  onAudioMuteToggle,
  onExit,
}) => {
  return (
    <div className="h-64 bg-gray-100 dark:bg-gray-900 p-2 grid grid-cols-12 gap-2 shrink-0 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <DockContainer title="Scenes" className="col-span-2">
        <ScenesDock
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSceneSelect={onSceneSelect}
          onAddScene={onAddScene}
          onDeleteScene={onDeleteScene}
          onExport={onExport}
          onImport={onImport}
          onRenameScene={onRenameScene}
        />
      </DockContainer>

      <DockContainer title="Sources" className="col-span-3">
        <SourcesDock
          sources={sources}
          onAddSource={() => setModal(ModalType.ADD_SOURCE)}
          onDeleteSource={onDeleteSource}
          onRenameSource={onRenameSource}
          selectedSourceId={selectedSourceId}
          onSelectSource={onSelectSource}
          onToggleVisibility={onToggleVisibility}
          onToggleLock={onToggleLock}
          onSetBackground={onSetBackground}
          setModal={setModal}
        />
      </DockContainer>

      <DockContainer title="Audio Mixer" className="col-span-3">
        <AudioMixerDock
          sources={sources}
          volumes={audioVolumes}
          muted={audioMuted}
          onVolumeChange={onAudioVolumeChange}
          onToggleMute={onAudioMuteToggle}
        />
      </DockContainer>

      <DockContainer title="Scene Transitions" className="col-span-2">
        <TransitionsDock
          transitionType={transitionType}
          setTransitionType={setTransitionType}
          transitionDuration={transitionDuration}
          setTransitionDuration={setTransitionDuration}
        />
      </DockContainer>

      <DockContainer title="Controls" className="col-span-2">
        <ControlsDock
          setModal={setModal}
          isStreaming={isStreaming}
          onStartStream={onStartStream}
          onStopStream={onStopStream}
          rtmpUrl={rtmpUrl}
          isRecording={isRecording}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          isPaused={isPaused}
          onPauseRecording={onPauseRecording}
          onResumeRecording={onResumeRecording}
          onExit={onExit}
        />
      </DockContainer>
    </div>
  );
};
