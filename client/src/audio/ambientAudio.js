// Web Audio API generator for immersive Tragic Diary atmosphere (gentle rain & warm vinyl crackle)
class AmbientAudioController {
  constructor() {
    this.audioCtx = null;
    this.rainNode = null;
    this.crackleNode = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
  }

  start() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) return;

    const ctx = this.audioCtx;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    this.gainNode.connect(ctx.destination);

    // Rain Sound (Filtered Brown/Pink Noise)
    const bufferSize = ctx.sampleRate * 2;
    const rainBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = rainBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise formula
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    this.rainNode = ctx.createBufferSource();
    this.rainNode.buffer = rainBuffer;
    this.rainNode.loop = true;

    // Filter to simulate soft raindrops
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(800, ctx.currentTime);

    this.rainNode.connect(rainFilter);
    rainFilter.connect(this.gainNode);
    this.rainNode.start(0);

    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;
    try {
      if (this.rainNode) {
        this.rainNode.stop();
        this.rainNode.disconnect();
      }
      this.isPlaying = false;
    } catch (e) {
      console.warn('Audio stop error:', e);
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}

export const ambientSound = new AmbientAudioController();
