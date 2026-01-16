// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scene } from '../Scene';
import { Source } from '../../types';

describe('Scene Class', () => {
  let canvas: HTMLCanvasElement;
  let scene: Scene;

  beforeEach(() => {
    // Mock MediaStream
    global.MediaStream = vi.fn().mockImplementation(() => ({
      getTracks: vi.fn().mockReturnValue([]),
      getVideoTracks: vi.fn().mockReturnValue([]),
      getAudioTracks: vi.fn().mockReturnValue([]),
    }));

    canvas = document.createElement('canvas');
    canvas.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 0 }),
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    });
    scene = new Scene(canvas);
  });

  it('should initialize with default values', () => {
    expect(scene.elements).toEqual([]);
    expect(scene.currentSceneId).toBe('1');
  });

  it('should add a source correctly', () => {
    const source: Source = {
      id: 'test-source',
      name: 'Test Source',
      type: 'camera',
      visible: true,
      locked: false,
      sceneId: '1',
    };
    const media = document.createElement('video');

    scene.addSource(source, media);

    expect(scene.elements.length).toBe(1);
    const element = scene.elements[0];
    expect(element.sceneId).toBe('1');
    expect(element.media).toBe(media);
  });

  it('should remove a source correctly', () => {
    const source: Source = {
      id: 'test-source-remove',
      name: 'Test Source Remove',
      type: 'camera',
      visible: true,
      locked: false,
      sceneId: '1',
    };
    const media = document.createElement('video');
    scene.addSource(source, media);
    // const elementToRemove = scene.elements[0];

    // Scene logic typically removes by element ID matching
    scene.removeSource(source.id);

    expect(scene.elements.length).toBe(0);
  });

  it('should check if point is in element', () => {
    // Create a mock element manually to test the pure geometry logic
    const el = {
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
      media: null,
      sceneId: '1',
      id: 'test-el',
    } as unknown as import('../Scene').SceneElement;

    // Point inside
    expect(scene.isPointInElement(50, 50, el)).toBe(true);

    // Point outside
    expect(scene.isPointInElement(200, 200, el)).toBe(false);
  });

  it('should move element to front', () => {
    // Mock two elements
    const el1 = { id: '1', zIndex: 0 } as unknown as import('../Scene').SceneElement;
    const el2 = { id: '2', zIndex: 0 } as unknown as import('../Scene').SceneElement;

    scene.elements = [el1, el2];

    // Assuming logic finds by ID and moves to end of array
    scene.bringToFront('1');

    // el1 should now be at the end of the array
    expect(scene.elements[1]).toBe(el1);
    expect(scene.elements[0]).toBe(el2);
  });
});
