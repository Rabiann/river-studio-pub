import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

describe('media.js utility functions', () => {
  let formatDuration, formatSize, getMetadata;

  beforeAll(async () => {
    // Spy on fs methods
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 1024 });

    // Spy on ffmpeg.ffprobe if possible.
    // Note: fluent-ffmpeg exports a function which has static methods.
    // We verify if 'ffmpeg' import has ffprobe.
    // If not, we might need to handle it differently, but vi.spyOn(ffmpeg, 'ffprobe') is standard.
    // However, typescript/vitest might complain if it's read-only.
    // We try to mock it.
    if (ffmpeg.ffprobe) {
      vi.spyOn(ffmpeg, 'ffprobe').mockImplementation((path, cb) => {
        cb(null, { format: { duration: 60 } });
      });
    } else {
      // Fallback or explicit assignment if spy fails?
      // Usually imports are bindings.
      // For CJS modules, properties can be spied.
      ffmpeg.ffprobe = vi.fn((path, cb) =>
        cb(null, { format: { duration: 60 } })
      );
    }

    const mod = await import('../media');
    formatDuration = mod.formatDuration;
    formatSize = mod.formatSize;
    getMetadata = mod.getMetadata;
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  // ... (formatDuration and formatSize tests remain unchanged)

  describe('getMetadata', () => {
    it('returns correct metadata', async () => {
      const filePath = 'test.mp4';

      // Usage of mockFfprobe if needed, e.g. mockFfprobe.mockClear()

      const data = await getMetadata(filePath);

      expect(data.size).toBe('1 KB');
    });
  });

  describe('formatDuration', () => {
    it('formats 0 seconds', () => {
      expect(formatDuration(0)).toBe('00:00:00');
    });

    it('formats seconds into MM:SS', () => {
      expect(formatDuration(65)).toBe('00:01:05');
    });

    it('formats seconds into HH:MM:SS', () => {
      expect(formatDuration(3665)).toBe('01:01:05');
    });

    it('handles non-numeric strings', () => {
      expect(formatDuration('invalid')).toBe('00:00:00');
    });
  });

  describe('formatSize', () => {
    it('formats 0 bytes', () => {
      expect(formatSize(0)).toBe('0 B');
    });

    it('formats bytes', () => {
      expect(formatSize(500)).toBe('500 B');
    });

    it('formats KB', () => {
      expect(formatSize(1024)).toBe('1 KB');
    });

    it('formats MB', () => {
      expect(formatSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });
  });
});
