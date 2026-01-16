export interface Scene {
  id: string;
  name: string;
}

export interface Source {
  id: string;
  name: string;
  type: 'image' | 'video' | 'browser' | 'audio' | 'camera' | 'text';
  visible: boolean;
  locked: boolean;
  sceneId: string;
  isBackground?: boolean;
  data?: unknown;
  // Text specific properties
  text?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string; // 'normal', 'bold'
  fontStyle?: string; // 'normal', 'italic'
  fontFamily?: string;
  // Layout properties
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface Recording {
  id: number;
  filename: string;
  path: string;
  date: string;
  duration: string;
  size: string;
  thumbnail: string;
  created_at: number;
}


export enum ModalType {
  NONE,
  SETTINGS,
  RECORDINGS,
  ADD_SOURCE,
  EDIT_SOURCE,
}

export interface ScreenSource {
  id: string;
  name: string;
  thumbnail?: string;
}

export type TabID = 'stream' | 'output' | 'tokens';

export interface StreamingProvider {
  id: string;
  name: string;
  url?: string;
}
