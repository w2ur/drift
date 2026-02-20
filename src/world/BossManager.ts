export interface BossPattern {
  name: string;
  pipeCount: number;
  getGapY: (index: number, baseGapY: number) => number;
  gapSizeMultiplier: number;
}

const BOSS_PATTERNS: BossPattern[] = [
  {
    name: "Zigzag", // Meadow exit
    pipeCount: 3,
    getGapY: (i, base) => base + (i % 2 === 0 ? 1.5 : -1.5),
    gapSizeMultiplier: 0.8,
  },
  {
    name: "Shrinking", // Sunset Canyon exit
    pipeCount: 4,
    getGapY: (_i, base) => base,
    gapSizeMultiplier: 0.7,
  },
  {
    name: "Wave", // Storm Sea exit
    pipeCount: 3,
    getGapY: (i, base) => base + Math.sin(i * 1.5) * 2,
    gapSizeMultiplier: 0.85,
  },
  {
    name: "Alternating", // Neon City exit
    pipeCount: 5,
    getGapY: (i, base) => base + (i % 2 === 0 ? 2 : -2),
    gapSizeMultiplier: 0.75,
  },
  {
    name: "Narrow", // Sky Temple exit
    pipeCount: 3,
    getGapY: (_i, base) => base,
    gapSizeMultiplier: 0.6,
  },
];

export class BossManager {
  active = false;
  private patternIndex = 0;
  private pipesCleared = 0;
  private totalBossPipes = 0;
  private hitDuringBoss = false;

  get currentPattern(): BossPattern | null {
    return this.active
      ? BOSS_PATTERNS[this.patternIndex % BOSS_PATTERNS.length]
      : null;
  }

  startBoss(biomeIndex: number): void {
    this.active = true;
    this.patternIndex = biomeIndex;
    this.pipesCleared = 0;
    this.hitDuringBoss = false;
    const pattern = BOSS_PATTERNS[this.patternIndex % BOSS_PATTERNS.length];
    this.totalBossPipes = pattern.pipeCount;
  }

  onBossPipePassed(): {
    complete: boolean;
    cleanClear: boolean;
    bonus: number;
  } {
    this.pipesCleared++;
    if (this.pipesCleared >= this.totalBossPipes) {
      const cleanClear = !this.hitDuringBoss;
      this.active = false;
      return { complete: true, cleanClear, bonus: cleanClear ? 10 : 0 };
    }
    return { complete: false, cleanClear: false, bonus: 0 };
  }

  onBossPipeHit(): void {
    this.hitDuringBoss = true;
  }

  reset(): void {
    this.active = false;
    this.pipesCleared = 0;
    this.hitDuringBoss = false;
  }
}
