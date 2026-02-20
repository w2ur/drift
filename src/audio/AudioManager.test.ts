import { describe, it, expect, vi, beforeEach } from "vitest";

// Minimal AudioContext mock
function makeGain() {
  return {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
  };
}

function makeOscillator() {
  return {
    type: "sine" as OscillatorType,
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function makeBufferSource() {
  return {
    buffer: null as AudioBuffer | null,
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
  };
}

function makeBiquadFilter() {
  return {
    type: "bandpass" as BiquadFilterType,
    frequency: { value: 0 },
    connect: vi.fn().mockReturnThis(),
  };
}

const mockDestination = {} as AudioDestinationNode;

function makeAudioContext() {
  return {
    state: "running" as AudioContextState,
    sampleRate: 44100,
    currentTime: 0,
    destination: mockDestination,
    resume: vi.fn(),
    createGain: vi.fn().mockImplementation(makeGain),
    createOscillator: vi.fn().mockImplementation(makeOscillator),
    createBuffer: vi.fn().mockImplementation(
      (_channels: number, size: number, _rate: number) => ({
        getChannelData: vi.fn().mockReturnValue(new Float32Array(size)),
      })
    ),
    createBufferSource: vi.fn().mockImplementation(makeBufferSource),
    createBiquadFilter: vi.fn().mockImplementation(makeBiquadFilter),
  };
}

vi.stubGlobal("AudioContext", vi.fn().mockImplementation(makeAudioContext));

import { AudioManager } from "./AudioManager";

describe("AudioManager", () => {
  let audio: AudioManager;

  beforeEach(() => {
    vi.clearAllMocks();
    audio = new AudioManager();
  });

  it("starts unmuted", () => {
    expect(audio.isMuted).toBe(false);
  });

  it("toggleMute returns true when muting", () => {
    expect(audio.toggleMute()).toBe(true);
    expect(audio.isMuted).toBe(true);
  });

  it("toggleMute returns false when unmuting", () => {
    audio.toggleMute();
    expect(audio.toggleMute()).toBe(false);
    expect(audio.isMuted).toBe(false);
  });

  it("toggleMute sets masterGain to 0 when muted", () => {
    // Trigger context creation by playing a sound
    audio.playFlap();
    audio.toggleMute();
    // Access the private masterGain indirectly via the AudioContext mock
    const ctx = (AudioContext as ReturnType<typeof vi.fn>).mock.results[0].value;
    const masterGainNode = ctx.createGain.mock.results[0].value;
    expect(masterGainNode.gain.value).toBe(0);
  });

  it("toggleMute sets masterGain to 1 when unmuted", () => {
    audio.playFlap();
    audio.toggleMute();
    audio.toggleMute();
    const ctx = (AudioContext as ReturnType<typeof vi.fn>).mock.results[0].value;
    const masterGainNode = ctx.createGain.mock.results[0].value;
    expect(masterGainNode.gain.value).toBe(1);
  });

  it("playFlap does not throw", () => {
    expect(() => audio.playFlap()).not.toThrow();
  });

  it("playFlap is silent when muted", () => {
    audio.toggleMute();
    audio.playFlap();
    // AudioContext should not have been created (lazy init) when muted
    expect(AudioContext).not.toHaveBeenCalled();
  });

  it("playScore does not throw", () => {
    expect(() => audio.playScore(0)).not.toThrow();
  });

  it("playScore uses higher frequency for higher combo", () => {
    audio.playScore(5);
    const ctx = (AudioContext as ReturnType<typeof vi.fn>).mock.results[0].value;
    const osc = ctx.createOscillator.mock.results[0].value;
    expect(osc.frequency.value).toBeGreaterThan(440);
  });

  it("playNearMiss does not throw", () => {
    expect(() => audio.playNearMiss(0)).not.toThrow();
  });

  it("playPowerUpCollect does not throw", () => {
    expect(() => audio.playPowerUpCollect()).not.toThrow();
  });

  it("playShieldBreak does not throw", () => {
    expect(() => audio.playShieldBreak()).not.toThrow();
  });

  it("playDeath does not throw", () => {
    expect(() => audio.playDeath()).not.toThrow();
  });

  it("playBossEntry does not throw", () => {
    expect(() => audio.playBossEntry()).not.toThrow();
  });

  it("playBossClear does not throw", () => {
    expect(() => audio.playBossClear()).not.toThrow();
  });

  it("playHighScore does not throw", () => {
    expect(() => audio.playHighScore()).not.toThrow();
  });

  it("startBiomeMusic does not throw", () => {
    expect(() => audio.startBiomeMusic("Meadow")).not.toThrow();
  });

  it("startBiomeMusic stops previous music before starting new", () => {
    audio.startBiomeMusic("Meadow");
    const ctx = (AudioContext as ReturnType<typeof vi.fn>).mock.results[0].value;
    const firstOsc = ctx.createOscillator.mock.results[0].value;
    audio.startBiomeMusic("Sunset Canyon");
    expect(firstOsc.stop).toHaveBeenCalled();
  });

  it("stopMusic stops the current oscillator", () => {
    audio.startBiomeMusic("Meadow");
    const ctx = (AudioContext as ReturnType<typeof vi.fn>).mock.results[0].value;
    const osc = ctx.createOscillator.mock.results[0].value;
    audio.stopMusic();
    expect(osc.stop).toHaveBeenCalled();
  });

  it("stopMusic is a no-op when no music is playing", () => {
    expect(() => audio.stopMusic()).not.toThrow();
  });

  it("startBiomeMusic is silent when muted", () => {
    audio.toggleMute();
    audio.startBiomeMusic("Meadow");
    // stopMusic is called but no oscillator created since muted
    expect(AudioContext).not.toHaveBeenCalled();
  });
});
