export interface LeaderboardEntry {
  name: string;
  score: number;
  biome: string;
  date: string;
}

export class LeaderboardManager {
  entries: LeaderboardEntry[] = [];
  private storageKey = "birdie_leaderboard";

  constructor() {
    this.load();
  }

  qualifies(score: number): boolean {
    return this.entries.length < 10 || score > this.entries[this.entries.length - 1].score;
  }

  addEntry(name: string, score: number, biome = "Meadow"): void {
    this.entries.push({
      name,
      score,
      biome,
      date: new Date().toISOString().split("T")[0],
    });
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, 10);
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.entries = JSON.parse(raw);
    } catch {
      // ignore parse errors
    }
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
  }
}
