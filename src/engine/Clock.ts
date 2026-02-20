export class Clock {
  elapsed = 0;
  delta = 0;
  scaledDelta = 0;
  timeScale = 1;
  private maxDelta = 0.05;

  clampDelta(raw: number): number {
    return Math.min(raw, this.maxDelta);
  }

  tick(rawDelta: number): void {
    this.delta = this.clampDelta(rawDelta);
    this.scaledDelta = this.delta * this.timeScale;
    this.elapsed += this.scaledDelta;
  }

  reset(): void {
    this.elapsed = 0;
    this.delta = 0;
    this.scaledDelta = 0;
    this.timeScale = 1;
  }
}
