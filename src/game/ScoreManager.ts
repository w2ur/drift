export class ScoreManager {
  score = 0;
  combo = 0;
  bestScore: number;
  private storageKey = "birdie_best_score";

  get multiplier(): number {
    return 1 + this.combo;
  }

  constructor() {
    this.bestScore = parseInt(localStorage.getItem(this.storageKey) || "0", 10);
  }

  addScore(points: number): void {
    this.score += points * this.multiplier;
    this.combo = 0;
  }

  registerNearMiss(): void {
    this.combo++;
  }

  finalize(): void {
    this.bestScore = Math.max(this.score, this.bestScore);
    localStorage.setItem(this.storageKey, this.bestScore.toString());
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
  }
}
