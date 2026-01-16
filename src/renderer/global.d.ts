import { ScreenSource } from './types';

declare global {
  interface Window {
    electronAPI: {
      getScreenSources: () => Promise<ScreenSource[]>;
      startStream: (url: string) => Promise<void>;
      stopStream: () => Promise<void>;
      sendStreamData: (data: Uint8Array) => Promise<void>;
      startRecording: (
        path?: string
      ) => Promise<{ filePath?: string; error?: string; path?: string }>;
      saveRecordingChunk: (data: Uint8Array) => Promise<void>;
      stopRecording: () => Promise<void>;
      quitApp: () => Promise<void>;
      // Token management
      createToken: (
        platform: string,
        token: string
      ) => Promise<{ success: boolean; id?: number; error?: string }>;
      getTokens: () => Promise<{
        success: boolean;
        tokens?: Array<{ id: number; platform: string; token: string }>;
        error?: string;
      }>;
      deleteToken: (
        platform: string
      ) => Promise<{ success: boolean; deleted?: boolean; error?: string }>;
      getToken: (
        platform: string
      ) => Promise<{ success: boolean; token?: unknown; error?: string }>;
      updateToken: (
        platform: string,
        token: string
      ) => Promise<{ success: boolean; updated?: boolean; error?: string }>;
      selectFile: (
        filters?: { name: string; extensions: string[] }[]
      ) => Promise<string | null>;
      selectDirectory: () => Promise<string | null>;
      // Recordings
      getRecordings: () => Promise<
        Array<{
          id: number;
          path: string;
          filename: string;
          date: string;
          duration?: string;
          size?: string;
          thumbnail?: string;
        }>
      >;
      deleteRecording: (id: number) => Promise<boolean>;
      openRecording: (id: number) => Promise<boolean>;
      openRecordingFolder: (id?: number | null) => Promise<boolean>;
      // Settings
      getSettings: () => Promise<{
        success: boolean;
        settings?: {
          theme: string;
          rtmpUrl: string;
          recordingPath: string;
          recordingFormat: string;
          hotkeys: Record<string, string>;
        };
        error?: string;
      }>;
      setSetting: (
        key: string,
        value: unknown
      ) => Promise<{ success: boolean; error?: string }>;
      getSetting: (
        key: string
      ) => Promise<{ success: boolean; value?: unknown; error?: string }>;
      setMultipleSettings: (settings: {
        theme?: string;
        rtmpUrl?: string;
        recordingPath?: string;
        recordingFormat?: string;
        hotkeys?: Record<string, string>;
      }) => Promise<{ success: boolean; error?: string }>;
      openExternal: (url: string) => Promise<boolean>;
      onStreamingError: (callback: (error: string) => void) => void;
      offStreamingError: () => void;
      onStreamingBitrate: (callback: (kbps: number) => void) => void;
      offStreamingBitrate: () => void;
    };
    addSceneImage: (id: string, url: string, props?: Partial<Source>) => void;
    addSceneVideo: (
      id: string,
      stream: MediaStream,
      props?: Partial<Source>
    ) => void;
    addSceneVideoFile: (
      id: string,
      url: string,
      props?: Partial<Source>
    ) => void;
    addSceneText: (
      id: string,
      text: string,
      options?: {
        color?: string;
        fontSize?: number;
        fontWeight?: string;
        fontStyle?: string;
      },
      props?: Partial<Source>
    ) => void;
    getSceneStream: () => MediaStream;
  }
}
