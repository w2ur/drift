export type GamePhase = "ready" | "playing" | "dying" | "ended";

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  ready: ["playing"],
  playing: ["dying"],
  dying: ["ended"],
  ended: ["ready"],
};

type PhaseCallback = (from: GamePhase) => void;

export class StateMachine {
  phase: GamePhase = "ready";
  private listeners = new Map<GamePhase, PhaseCallback[]>();

  transition(to: GamePhase): boolean {
    if (!VALID_TRANSITIONS[this.phase].includes(to)) return false;
    const from = this.phase;
    this.phase = to;
    this.listeners.get(to)?.forEach((cb) => cb(from));
    return true;
  }

  on(phase: GamePhase, callback: PhaseCallback): void {
    if (!this.listeners.has(phase)) this.listeners.set(phase, []);
    this.listeners.get(phase)!.push(callback);
  }

  reset(): void {
    this.phase = "ready";
  }
}
