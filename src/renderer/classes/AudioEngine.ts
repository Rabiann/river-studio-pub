export class AudioEngine {
  context: AudioContext;
  destination: MediaStreamAudioDestinationNode;
  inputs: Map<string, { source: AudioNode; gain: GainNode }>;

  constructor() {
    this.context = new AudioContext();
    this.destination = this.context.createMediaStreamDestination();
    this.inputs = new Map();
  }

  async addInput(
    id: string,
    sourceInput: MediaStream | HTMLMediaElement,
    options: { monitor?: boolean } = {}
  ) {
    if (this.inputs.has(id)) return;

    // Ensure context is running (browser policy)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    let source: AudioNode;

    if (sourceInput instanceof HTMLMediaElement) {
      // This hijacks the audio from the element
      source = this.context.createMediaElementSource(sourceInput);
    } else {
      source = this.context.createMediaStreamSource(sourceInput);
    }

    const gain = this.context.createGain();

    console.log(`🎹 AudioEngine: Adding input ${id}, context state: ${this.context.state}`);
    source.connect(gain);
    gain.connect(this.destination);

    // Monitor locally if requested (e.g. for video files, but not for mic)
    if (options.monitor) {
      console.log(`🎧 Monitoring enabled for ${id}`);
      gain.connect(this.context.destination);
    }

    this.inputs.set(id, { source, gain });
  }

  removeInput(id: string) {
    const input = this.inputs.get(id);
    if (input) {
      input.source.disconnect();
      input.gain.disconnect();
      this.inputs.delete(id);
    }
  }

  setVolume(id: string, volume: number) {
    const input = this.inputs.get(id);
    if (input) {
      input.gain.gain.value = volume;
    }
  }

  setMute(id: string, muted: boolean) {
    const input = this.inputs.get(id);
    if (input) {
      if (muted) {
        input.gain.gain.value = 0;
      } else {
        // Restore volume from inputs map
        input.gain.gain.value = 1; // Default to 1, volume change will sync it later if needed
      }
    }
  }

  getOutputStream() {
    return this.destination.stream;
  }

  resume() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }
}
