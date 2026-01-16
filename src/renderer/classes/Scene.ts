import { Source } from '../types';

/**
 * Represents an element within a scene on the canvas.
 */
export interface SceneElement extends Source {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  media: HTMLImageElement | HTMLVideoElement | null;
  sceneId: string;
  // Text specific properties
  text?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
}

/**
 * The Scene class manages the HTML5 Canvas rendering and user interactions
 * for the streaming editor. It handles element manipulation, transitions,
 * and the animation loop.
 */
export class Scene {
  instanceId: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  elements: SceneElement[];
  currentSceneId: string;
  selectedElementId: string | null;
  interactionMode: 'move' | 'resize' | 'rotate' | 'none';
  activeHandle: 'tl' | 'tr' | 'bl' | 'br' | null;
  dragOffset: { x: number; y: number };
  startRotation: number;
  startMouseAngle: number;
  startDragPos: { x: number; y: number };
  startElState: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  } | null;
  animationId: number | null;
  possibleDeselect: boolean = false;
  onSourceRemoved?: (id: string) => void;
  onSourceSelected?: (id: string | null) => void;
  onSourceUpdated?: (id: string, updates: Partial<SceneElement>) => void;

  transitionState: {
    startTime: number;
    duration: number;
    fromId: string;
    toId: string;
  } | null = null;

  constructor(canvas: HTMLCanvasElement, initialSceneId: string = '1') {
    this.canvas = canvas;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2d context');
    this.ctx = context;

    this.elements = [];
    this.currentSceneId = initialSceneId;
    this.selectedElementId = null;
    this.interactionMode = 'none';
    this.activeHandle = null;
    this.dragOffset = { x: 0, y: 0 };
    this.startRotation = 0;
    this.startMouseAngle = 0;
    this.startDragPos = { x: 0, y: 0 };
    this.startElState = null;
    this.animationId = null;
    this.possibleDeselect = false;
    this.instanceId = Math.floor(Math.random() * 10000);

    // Set canvas size
    this.canvas.width = 1280;
    this.canvas.height = 720;

    this.setupEventListeners();

    // Start animation loop
    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  setupEventListeners() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = () => {
    // Delete functionality is not accessible on scene editor - use scene list for that
  };

  getElementById(id: string): SceneElement | undefined {
    return this.elements.find((el) => el.id === id);
  }

  transitionToScene(id: string, type: 'cut' | 'fade', duration: number) {
    if (type === 'cut') {
      this.currentSceneId = id;
      this.selectedElementId = null;
      this.transitionState = null;
      if (this.onSourceSelected) this.onSourceSelected(null);
      // Render will handle the new scene on next frame
    } else if (type === 'fade') {
      this.transitionState = {
        startTime: performance.now(),
        duration: duration,
        fromId: this.currentSceneId,
        toId: id,
      };
      this.selectedElementId = null;
      if (this.onSourceSelected) this.onSourceSelected(null);
    }
  }

  setScene(id: string) {
    this.currentSceneId = id;
    this.selectedElementId = null;
    this.transitionState = null;
    if (this.onSourceSelected) this.onSourceSelected(null);
  }

  renderTransition(fromId: string, toId: string, progress: number) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw 'from' scene
    this.ctx.globalAlpha = 1 - progress;
    this.elements.forEach((el) => {
      if (!el.visible || el.sceneId !== fromId) return;
      this.drawElement(el);
    });

    // Draw 'to' scene
    this.ctx.globalAlpha = progress;
    this.elements.forEach((el) => {
      if (!el.visible || el.sceneId !== toId) return;
      this.drawElement(el);
    });

    this.ctx.globalAlpha = 1;
  }

  drawElement(el: SceneElement) {
    this.ctx.save();

    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    this.ctx.translate(cx, cy);
    this.ctx.rotate(el.rotation);
    this.ctx.translate(-cx, -cy);

    if (el.type === 'text' && el.text) {
      const style = el.fontStyle || 'normal';
      const weight = el.fontWeight || 'normal';
      const size = el.fontSize || 40;
      const family = el.fontFamily || 'Arial';
      this.ctx.font = `${style} ${weight} ${size}px ${family}`;
      this.ctx.fillStyle = el.color || '#ffffff';
      this.ctx.textBaseline = 'top';
      // Add simple shadow for better visibility
      this.ctx.shadowColor = 'black';
      this.ctx.shadowBlur = 4;
      this.ctx.shadowOffsetX = 2;
      this.ctx.shadowOffsetY = 2;

      this.ctx.fillText(el.text, el.x, el.y);

      // Reset shadow
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    } else if (el.media) {
      this.ctx.drawImage(el.media, el.x, el.y, el.width, el.height);
    }

    this.ctx.restore();
  }

  addSource(source: Source, media: HTMLImageElement | HTMLVideoElement | null) {
    let width = 400;
    let height = 300;

    if (source.type === 'text' && source.text) {
      const style = source.fontStyle || 'normal';
      const weight = source.fontWeight || 'normal';
      const size = source.fontSize || 40;
      const family = source.fontFamily || 'Arial';
      this.ctx.font = `${style} ${weight} ${size}px ${family}`;
      const metrics = this.ctx.measureText(source.text);
      width = metrics.width;
      height = size * 1.2; // Approx height
    } else if (media) {
      width = media instanceof HTMLVideoElement ? 640 : media.width || 400;
      height = media instanceof HTMLVideoElement ? 360 : media.height || 300;
    }

    const newEl: SceneElement = {
      ...source,
      x: source.x ?? 100,
      y: source.y ?? 100,
      width: source.width ?? width,
      height: source.height ?? height,
      rotation: source.rotation ?? 0,
      media: media,
      sceneId: source.sceneId,
    };

    if (newEl.isBackground) {
      // Backgrounds go to the bottom and fill the screen
      newEl.x = 0;
      newEl.y = 0;
      newEl.width = this.canvas.width;
      newEl.height = this.canvas.height;
      newEl.locked = true;
      this.elements.unshift(newEl);
    } else {
      this.elements.push(newEl);
    }
  }

  removeSource(id: string) {
    const index = this.elements.findIndex((el) => el.id === id);
    if (index !== -1) {
      const element = this.elements[index];

      // Cleanup media resources
      if (element.media) {
        if (element.media instanceof HTMLVideoElement) {
          const video = element.media;

          // Stop MediaStream tracks (for webcam/screen capture)
          if (video.srcObject instanceof MediaStream) {
            const stream = video.srcObject;
            stream.getTracks().forEach((track) => {
              track.stop();
            });
            video.srcObject = null;
          }

          // Pause and cleanup video element
          video.pause();

          // Revoke object URL if it was created from a file
          if (video.src && video.src.startsWith('blob:')) {
            URL.revokeObjectURL(video.src);
          }

          video.src = '';
          video.load(); // Reset the video element
        }
      }

      this.elements.splice(index, 1);
      if (this.selectedElementId === id) {
        this.selectedElementId = null;
        if (this.onSourceSelected) this.onSourceSelected(null);
      }
      // Trigger callback to cleanup associated resources (e.g., audio)
      if (this.onSourceRemoved) this.onSourceRemoved(id);
    }
  }

  updateSource(id: string, updates: Partial<Source>) {
    const el = this.getElementById(id);
    if (el) {
      Object.assign(el, updates);

      // Handle specific updates if needed
      if (updates.isBackground) {
        // If becoming background, move to bottom and resize
        if (updates.isBackground) {
          el.x = 0;
          el.y = 0;
          el.width = this.canvas.width;
          el.height = this.canvas.height;
          el.locked = true;
          el.rotation = 0;

          // Move to bottom
          const index = this.elements.indexOf(el);
          this.elements.splice(index, 1);
          this.elements.unshift(el);
        } else {
          // Unset background
          el.locked = false;
          // Maybe reset size? Or keep full screen but unlocked.
          // User can resize now.
        }
      }
    }
  }

  selectSource(id: string | null) {
    this.selectedElementId = id;
  }

  bringToFront(id: string) {
    const index = this.elements.findIndex((el) => el.id === id);
    if (index !== -1 && index < this.elements.length - 1) {
      const el = this.elements[index];
      this.elements.splice(index, 1);
      this.elements.push(el);
    }
  }

  getMousePos(e: MouseEvent) {
    // Use offsetX/Y for simpler relative coordinates
    // Fallback to clientX/Y if needed (though MouseEvent usually has offset)
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: e.offsetX * scaleX,
      y: e.offsetY * scaleY,
    };
  }

  isPointInElement(x: number, y: number, el: SceneElement) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    const dx = x - cx;
    const dy = y - cy;

    const cos = Math.cos(-el.rotation);
    const sin = Math.sin(-el.rotation);

    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    return (
      rx >= -el.width / 2 &&
      rx <= el.width / 2 &&
      ry >= -el.height / 2 &&
      ry <= el.height / 2
    );
  }

  getControls(el: SceneElement) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;

    const transform = (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const cos = Math.cos(el.rotation);
      const sin = Math.sin(el.rotation);
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos,
      };
    };

    return {
      tl: transform(el.x, el.y),
      tr: transform(el.x + el.width, el.y),
      bl: transform(el.x, el.y + el.height),
      br: transform(el.x + el.width, el.y + el.height),
      rotate: transform(el.x + el.width / 2, el.y - 30),
      topCenter: transform(el.x + el.width / 2, el.y),
    };
  }

  handleMouseDown(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);

    if (this.selectedElementId) {
      const selectedElement = this.getElementById(this.selectedElementId);
      if (
        selectedElement &&
        !selectedElement.locked &&
        selectedElement.visible
      ) {
        const controls = this.getControls(selectedElement);
        const handleSize = 30; // Interactive hit area size

        // Check rotate handle
        if (
          Math.abs(x - controls.rotate.x) < handleSize &&
          Math.abs(y - controls.rotate.y) < handleSize
        ) {
          this.interactionMode = 'rotate';
          const cx = selectedElement.x + selectedElement.width / 2;
          const cy = selectedElement.y + selectedElement.height / 2;
          this.startMouseAngle = Math.atan2(y - cy, x - cx);
          this.startRotation = selectedElement.rotation;
          return;
        }

        // Check resize handles
        const handles = ['tl', 'tr', 'bl', 'br'] as const;
        for (const handle of handles) {
          if (
            Math.abs(x - controls[handle].x) < handleSize &&
            Math.abs(y - controls[handle].y) < handleSize
          ) {
            this.interactionMode = 'resize';
            this.activeHandle = handle;
            this.startDragPos = { x, y };
            this.startElState = {
              x: selectedElement.x,
              y: selectedElement.y,
              width: selectedElement.width,
              height: selectedElement.height,
              rotation: selectedElement.rotation,
            };
            return;
          }
        }
      }
    }

    // Check for element selection (top to bottom)
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const el = this.elements[i];
      if (!el.visible || el.locked || el.sceneId !== this.currentSceneId)
        continue; // Skip invisible, locked, or other scene elements

      if (this.isPointInElement(x, y, el)) {
        if (this.selectedElementId === el.id) {
          this.possibleDeselect = true;
          this.startDragPos = { x, y };
        } else {
          this.selectedElementId = el.id;
          if (this.onSourceSelected) this.onSourceSelected(el.id);
          this.possibleDeselect = false;
        }

        if (!el.locked) {
          this.interactionMode = 'move';
          this.dragOffset.x = x;
          this.dragOffset.y = y;

          // Start position for drag threshold check
          this.startDragPos = { x, y };

          // Bring to front on select
          this.bringToFront(el.id);
        }

        return;
      }
    }

    // Deselect if clicked empty space
    this.selectedElementId = null;
    if (this.onSourceSelected) this.onSourceSelected(null);
    this.interactionMode = 'none';
  }

  handleMouseMove(e: MouseEvent) {
    const { x, y } = this.getMousePos(e);
    const selectedElement = this.selectedElementId
      ? this.getElementById(this.selectedElementId)
      : null;

    this.canvas.style.cursor = 'default';

    if (
      selectedElement &&
      !selectedElement.locked &&
      selectedElement.visible &&
      selectedElement.sceneId === this.currentSceneId
    ) {
      const controls = this.getControls(selectedElement);
      const handleSize = 30; // Match hit test size

      if (
        Math.abs(x - controls.rotate.x) < handleSize &&
        Math.abs(y - controls.rotate.y) < handleSize
      ) {
        this.canvas.style.cursor = 'grab';
      } else if (
        Math.abs(x - controls.tl.x) < handleSize &&
        Math.abs(y - controls.tl.y) < handleSize
      ) {
        this.canvas.style.cursor = 'nwse-resize';
      } else if (
        Math.abs(x - controls.tr.x) < handleSize &&
        Math.abs(y - controls.tr.y) < handleSize
      ) {
        this.canvas.style.cursor = 'nesw-resize';
      } else if (
        Math.abs(x - controls.bl.x) < handleSize &&
        Math.abs(y - controls.bl.y) < handleSize
      ) {
        this.canvas.style.cursor = 'nesw-resize';
      } else if (
        Math.abs(x - controls.br.x) < handleSize &&
        Math.abs(y - controls.br.y) < handleSize
      ) {
        this.canvas.style.cursor = 'nwse-resize';
      } else if (this.isPointInElement(x, y, selectedElement)) {
        this.canvas.style.cursor = 'move';
      }
    }

    if (
      !selectedElement ||
      this.interactionMode === 'none' ||
      selectedElement.locked
    )
      return;

    if (this.interactionMode === 'move') {
      const dx = x - this.dragOffset.x;
      const dy = y - this.dragOffset.y;

      // Check if moved enough to cancel deselection
      if (this.possibleDeselect) {
        const totalDx = x - this.startDragPos.x;
        const totalDy = y - this.startDragPos.y;
        if (totalDx * totalDx + totalDy * totalDy > 9) {
          this.possibleDeselect = false;
        }
      }

      selectedElement.x += dx;
      selectedElement.y += dy;

      this.dragOffset.x = x;
      this.dragOffset.y = y;
    } else if (this.interactionMode === 'rotate') {
      const cx = selectedElement.x + selectedElement.width / 2;
      const cy = selectedElement.y + selectedElement.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      selectedElement.rotation =
        this.startRotation + (angle - this.startMouseAngle);
    } else if (this.interactionMode === 'resize' && this.startElState) {
      const dx = x - this.startDragPos.x;
      const dy = y - this.startDragPos.y;

      const start = this.startElState;
      const cos = Math.cos(start.rotation);
      const sin = Math.sin(start.rotation);

      // Calculate new dimensions and position based on handle
      let newW = start.width;
      let newH = start.height;
      let newX = start.x;
      let newY = start.y;

      // Local delta: dot product with axes
      const localDx = dx * cos + dy * sin;
      const localDy = -dx * sin + dy * cos;

      if (this.activeHandle === 'br') {
        newW = Math.max(20, start.width + localDx);
        newH = Math.max(20, start.height + localDy);

        const dW = newW - start.width;
        const dH = newH - start.height;

        // Rotate (dW/2, dH/2)
        const rx = (dW / 2) * cos - (dH / 2) * sin;
        const ry = (dW / 2) * sin + (dH / 2) * cos;

        const cx = start.x + start.width / 2;
        const cy = start.y + start.height / 2;

        const ncx = cx + rx;
        const ncy = cy + ry;

        newX = ncx - newW / 2;
        newY = ncy - newH / 2;
      } else if (this.activeHandle === 'tr') {
        newW = Math.max(20, start.width + localDx);
        newH = Math.max(20, start.height - localDy);

        const dW = newW - start.width;
        const dH = newH - start.height;

        const rx = (dW / 2) * cos - (-dH / 2) * sin;
        const ry = (dW / 2) * sin + (-dH / 2) * cos;

        const cx = start.x + start.width / 2;
        const cy = start.y + start.height / 2;

        newX = cx + rx - newW / 2;
        newY = cy + ry - newH / 2;
      } else if (this.activeHandle === 'bl') {
        newW = Math.max(20, start.width - localDx);
        newH = Math.max(20, start.height + localDy);

        const dW = newW - start.width;
        const dH = newH - start.height;

        const rx = (-dW / 2) * cos - (dH / 2) * sin;
        const ry = (-dW / 2) * sin + (dH / 2) * cos;

        const cx = start.x + start.width / 2;
        const cy = start.y + start.height / 2;

        newX = cx + rx - newW / 2;
        newY = cy + ry - newH / 2;
      } else if (this.activeHandle === 'tl') {
        newW = Math.max(20, start.width - localDx);
        newH = Math.max(20, start.height - localDy);

        const dW = newW - start.width;
        const dH = newH - start.height;

        const rx = (-dW / 2) * cos - (-dH / 2) * sin;
        const ry = (-dW / 2) * sin + (-dH / 2) * cos;

        const cx = start.x + start.width / 2;
        const cy = start.y + start.height / 2;

        newX = cx + rx - newW / 2;
        newY = cy + ry - newH / 2;
      }

      selectedElement.x = newX;
      selectedElement.y = newY;
      selectedElement.width = newW;
      selectedElement.height = newH;
    }
  }

  handleMouseUp() {
    if (this.possibleDeselect) {
      this.selectedElementId = null;
      if (this.onSourceSelected) this.onSourceSelected(null);
      this.possibleDeselect = false;
    }

    if (this.interactionMode !== 'none' && this.selectedElementId) {
      const el = this.getElementById(this.selectedElementId);
      if (el && this.onSourceUpdated) {
        this.onSourceUpdated(el.id, {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
        });
      }
    }
    this.interactionMode = 'none';
    this.activeHandle = null;
  }

  animate() {
    this.render();
    this.animationId = requestAnimationFrame(this.animate);
  }

  render() {
    // Handle Transition
    if (this.transitionState) {
      const now = performance.now();
      const elapsed = now - this.transitionState.startTime;
      const progress = Math.min(elapsed / this.transitionState.duration, 1);

      this.renderTransition(
        this.transitionState.fromId,
        this.transitionState.toId,
        progress
      );

      if (progress >= 1) {
        this.currentSceneId = this.transitionState.toId;
        this.transitionState = null;
        // Next frame will render the new scene normally
      }
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.elements.forEach((el) => {
      if (!el.visible || el.sceneId !== this.currentSceneId) return;

      this.drawElement(el);
    });

    // Draw controls AFTER all elements, in world space (not rotated)
    this.elements.forEach((el) => {
      if (!el.visible || el.sceneId !== this.currentSceneId) return;
      if (el.id === this.selectedElementId && !el.locked) {
        const controls = this.getControls(el);

        // Draw bounding box
        this.ctx.save();
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        this.ctx.translate(cx, cy);
        this.ctx.rotate(el.rotation);
        this.ctx.translate(-cx, -cy);

        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(el.x, el.y, el.width, el.height);
        this.ctx.restore();

        // Draw resize handles in world space
        this.ctx.fillStyle = '#ffffff';
        const handleSize = 8;
        this.ctx.fillRect(
          controls.tl.x - handleSize / 2,
          controls.tl.y - handleSize / 2,
          handleSize,
          handleSize
        );
        this.ctx.fillRect(
          controls.tr.x - handleSize / 2,
          controls.tr.y - handleSize / 2,
          handleSize,
          handleSize
        );
        this.ctx.fillRect(
          controls.bl.x - handleSize / 2,
          controls.bl.y - handleSize / 2,
          handleSize,
          handleSize
        );
        this.ctx.fillRect(
          controls.br.x - handleSize / 2,
          controls.br.y - handleSize / 2,
          handleSize,
          handleSize
        );

        // Rotation handle
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(controls.topCenter.x, controls.topCenter.y);
        this.ctx.lineTo(controls.rotate.x, controls.rotate.y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(controls.rotate.x, controls.rotate.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fill();
      }
    });
  }
}
