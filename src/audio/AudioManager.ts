export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private musicGain: GainNode | null = null;
  private currentMusicOsc: OscillatorNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  playFlap(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    // White noise burst through bandpass
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000 + Math.random() * 400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    source.connect(filter).connect(gain).connect(this.masterGain!);
    source.start();
  }

  playScore(combo: number = 0): void {
    if (this.muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 440 * (1 + combo * 0.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  playNearMiss(combo: number = 0): void {
    if (this.muted) return;
    const ctx = this.getContext();
    // Swoosh + bass thump
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200 + combo * 20, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  playPowerUpCollect(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    // Shimmer: multiple detuned sines
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.4 + i * 0.05
      );
      osc.connect(gain).connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 0.5);
    });
  }

  playShieldBreak(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    source.connect(filter).connect(gain).connect(this.masterGain!);
    source.start();
  }

  playDeath(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    // Impact
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain).connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  }

  playBossEntry(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 100;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.connect(gain).connect(this.masterGain!);
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  }

  playBossClear(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.5 + i * 0.1
      );
      osc.connect(gain).connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + 0.6 + i * 0.1);
    });
  }

  playHighScore(): void {
    if (this.muted) return;
    const ctx = this.getContext();
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.3 + i * 0.08
      );
      osc.connect(gain).connect(this.masterGain!);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + 0.4 + i * 0.08);
    });
  }

  startBiomeMusic(biomeName: string): void {
    this.stopMusic();
    if (this.muted) return;
    // Simple droning tone per biome — placeholder for more complex music
    const ctx = this.getContext();
    const freqs: Record<string, number> = {
      Meadow: 261,
      "Sunset Canyon": 220,
      "Storm Sea": 196,
      "Neon City": 164,
      "Sky Temple": 293,
    };
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freqs[biomeName] ?? 261;
    osc.connect(this.musicGain!);
    osc.start();
    this.currentMusicOsc = osc;
  }

  stopMusic(): void {
    if (this.currentMusicOsc) {
      this.currentMusicOsc.stop();
      this.currentMusicOsc = null;
    }
  }
}
