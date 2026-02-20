import { LeaderboardEntry } from "../game/LeaderboardManager";

export class UIManager {
  private container: HTMLElement;
  private scoreEl!: HTMLElement;
  private startScreen!: HTMLElement;
  private gameOverScreen!: HTMLElement;
  private muteBtn!: HTMLElement;
  private comboEl!: HTMLElement;
  private powerUpHUDEl!: HTMLElement;
  private powerUpBars: Map<string, { bar: HTMLElement; label: HTMLElement; wrapper: HTMLElement }> = new Map();
  private isMuted = false;

  constructor() {
    this.container = document.getElementById("ui")!;
    this.injectStyles();
    this.createScoreDisplay();
    this.createStartScreen();
    this.createGameOverScreen();
    this.createMuteButton();
    this.createComboDisplay();
    this.createPowerUpHUD();
  }

  private injectStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      @keyframes popIn {
        0% { transform: translateX(-50%) scale(1.3); }
        100% { transform: translateX(-50%) scale(1); }
      }

      @keyframes slideUp {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }

      @keyframes goldGlow {
        0%, 100% {
          color: #FFD700;
          text-shadow: 0 0 8px rgba(255,215,0,0.6), 0 0 20px rgba(255,215,0,0.4), 2px 2px 4px rgba(0,0,0,0.8);
        }
        50% {
          color: #FFF8DC;
          text-shadow: 0 0 16px rgba(255,215,0,1), 0 0 40px rgba(255,200,0,0.8), 0 0 60px rgba(255,180,0,0.5), 2px 2px 4px rgba(0,0,0,0.8);
        }
      }

      @keyframes flashWarn {
        0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
        25% { opacity: 0.2; transform: translateX(-50%) scale(0.95); }
        75% { opacity: 1; transform: translateX(-50%) scale(1.08); }
      }

      @keyframes biomeFade {
        0% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        70% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
      }

      @keyframes springIn {
        0% { transform: scale(0.5); opacity: 0; }
        60% { transform: scale(1.15); opacity: 1; }
        80% { transform: scale(0.95); }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes scorePopIn {
        0% { transform: scale(1.4); }
        100% { transform: scale(1); }
      }

      .birdie-panel {
        background: rgba(10, 10, 20, 0.88);
        border: 2px solid rgba(255, 215, 0, 0.7);
        border-radius: 10px;
      }

      @media (prefers-color-scheme: light) {
        .birdie-panel {
          background: rgba(240, 235, 210, 0.92);
          border: 2px solid rgba(180, 140, 0, 0.8);
        }
        .birdie-text-primary { color: #1a1400 !important; }
        .birdie-text-secondary { color: rgba(30, 20, 0, 0.65) !important; }
        .birdie-text-dim { color: rgba(30, 20, 0, 0.45) !important; }
        .birdie-text-gold { color: #a07800 !important; }
        .birdie-text-white { color: #1a1400 !important; }
        .birdie-overlay-bg { background: rgba(200, 190, 160, 0.55) !important; }
        .birdie-table-row-gold { background: rgba(255,215,0,0.15) !important; }
        .birdie-table-row-silver { background: rgba(192,192,192,0.15) !important; }
        .birdie-table-row-bronze { background: rgba(205,127,50,0.15) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  private createScoreDisplay(): void {
    this.scoreEl = document.createElement("div");
    this.scoreEl.style.cssText = `
      position: absolute; top: 40px; left: 50%; transform: translateX(-50%);
      font-size: 64px; font-weight: 900; color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.3);
      font-family: system-ui; z-index: 10; display: none;
    `;
    this.scoreEl.textContent = "0";
    this.container.appendChild(this.scoreEl);
  }

  private createStartScreen(): void {
    this.startScreen = document.createElement("div");
    this.startScreen.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 20;
    `;

    const title = document.createElement("h1");
    title.style.cssText = `
      font-size: 88px; font-weight: 900; color: #FFD700; margin: 0;
      letter-spacing: 18px; font-family: system-ui;
      text-shadow:
        4px 4px 0 rgba(180,120,0,0.8),
        8px 8px 0 rgba(100,60,0,0.4),
        0 0 30px rgba(255,215,0,0.5),
        0 0 60px rgba(255,180,0,0.25);
    `;
    title.textContent = "BIRDIE";

    const subtitle = document.createElement("p");
    subtitle.classList.add("birdie-text-secondary");
    subtitle.style.cssText = `
      font-size: 16px; color: rgba(255,255,255,0.65); margin-top: 14px;
      font-family: 'Courier New', monospace; letter-spacing: 4px;
      text-transform: uppercase;
    `;
    subtitle.textContent = "A 3D Flappy Adventure";

    const divider = document.createElement("div");
    divider.style.cssText = `
      width: 120px; height: 1px; background: rgba(255,215,0,0.4);
      margin: 24px 0;
    `;

    const prompt = document.createElement("p");
    prompt.classList.add("birdie-text-dim");
    prompt.style.cssText = `
      font-size: 14px; color: rgba(255,255,255,0.45); margin: 0;
      font-family: 'Courier New', monospace; letter-spacing: 3px;
      text-transform: uppercase;
      animation: pulse 2s ease-in-out infinite;
    `;
    prompt.textContent = "Click or Space to play";

    const powerUpLegend = document.createElement("div");
    powerUpLegend.style.cssText = `
      display: flex; gap: 16px; margin-top: 20px; flex-wrap: wrap; justify-content: center;
      font-family: 'Courier New', monospace; font-size: 11px;
      color: rgba(255,255,255,0.5); letter-spacing: 1px;
    `;
    const powerUps = [
      { symbol: "\u25CF", color: "#4FC3F7", label: "SHIELD" },
      { symbol: "\u25CB", color: "#CE93D8", label: "SLOW-MO" },
      { symbol: "\u25A0", color: "#EF5350", label: "GIANT" },
      { symbol: "\u2736", color: "#FFD700", label: "x2 SCORE" },
    ];
    for (const pu of powerUps) {
      const item = document.createElement("span");
      item.innerHTML = `<span style="color:${pu.color}; font-size: 14px;">${pu.symbol}</span> ${pu.label}`;
      powerUpLegend.appendChild(item);
    }

    this.startScreen.appendChild(title);
    this.startScreen.appendChild(subtitle);
    this.startScreen.appendChild(divider);
    this.startScreen.appendChild(powerUpLegend);
    this.startScreen.appendChild(prompt);
    this.container.appendChild(this.startScreen);
  }

  private createGameOverScreen(): void {
    this.gameOverScreen = document.createElement("div");
    this.gameOverScreen.classList.add("birdie-overlay-bg");
    this.gameOverScreen.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: none; flex-direction: column; align-items: center; justify-content: center;
      z-index: 20; background: rgba(0,0,0,0.45);
    `;
    this.container.appendChild(this.gameOverScreen);
  }

  private createMuteButton(): void {
    this.muteBtn = document.createElement("button");
    this.muteBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px;
      font-size: 20px; background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.15);
      color: white; width: 44px; height: 44px; border-radius: 22px;
      cursor: pointer; z-index: 30; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    `;
    this.muteBtn.textContent = "\uD83D\uDD0A";
    this.muteBtn.addEventListener("click", () => {
      this.isMuted = !this.isMuted;
      this.muteBtn.textContent = this.isMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
    });
    this.container.appendChild(this.muteBtn);
  }

  private createComboDisplay(): void {
    this.comboEl = document.createElement("div");
    this.comboEl.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-size: 36px; font-weight: 900; color: #FFD700;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      font-family: system-ui; z-index: 15; display: none;
      transition: opacity 0.3s, transform 0.3s;
    `;
    this.container.appendChild(this.comboEl);
  }

  private createPowerUpHUD(): void {
    this.powerUpHUDEl = document.createElement("div");
    this.powerUpHUDEl.style.cssText = `
      position: absolute; bottom: 24px; left: 24px;
      display: flex; flex-direction: column; gap: 8px;
      z-index: 15; pointer-events: none;
    `;
    this.container.appendChild(this.powerUpHUDEl);
  }

  showPlaying(): void {
    this.startScreen.style.display = "none";
    this.gameOverScreen.style.display = "none";
    this.scoreEl.style.display = "block";
  }

  showGameOver(score: number, bestScore: number, isNewBest: boolean): void {
    this.scoreEl.style.display = "none";
    this.gameOverScreen.style.display = "flex";
    this.gameOverScreen.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      text-align: center;
      animation: slideUp 0.5s ease-out;
      display: flex; flex-direction: column; align-items: center;
    `;

    const label = document.createElement("p");
    if (isNewBest) {
      label.classList.add("birdie-text-gold");
      label.style.cssText = `
        font-size: 22px; font-weight: 900; margin: 0;
        font-family: 'Courier New', monospace; letter-spacing: 4px;
        animation: goldGlow 1.2s ease-in-out infinite;
        color: #FFD700;
      `;
      label.textContent = "NEW HIGH SCORE!";
    } else {
      label.classList.add("birdie-text-secondary");
      label.style.cssText = `
        font-size: 20px; color: rgba(255,255,255,0.6); margin: 0;
        font-family: 'Courier New', monospace; letter-spacing: 4px;
      `;
      label.textContent = "GAME OVER";
    }

    const scoreDisplay = document.createElement("p");
    scoreDisplay.classList.add("birdie-text-white");
    scoreDisplay.style.cssText = `
      font-size: 80px; font-weight: 900; color: white; margin: 12px 0 4px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.6); font-family: system-ui;
      animation: springIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      line-height: 1;
    `;
    scoreDisplay.textContent = score.toString();

    const bestDisplay = document.createElement("p");
    bestDisplay.classList.add("birdie-text-dim");
    bestDisplay.style.cssText = `
      font-size: 15px; color: rgba(255,255,255,0.4); margin: 4px 0 0;
      font-family: 'Courier New', monospace; letter-spacing: 2px;
    `;
    bestDisplay.textContent = `BEST: ${bestScore}`;

    const restartPrompt = document.createElement("p");
    restartPrompt.classList.add("birdie-text-dim");
    restartPrompt.style.cssText = `
      font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 28px;
      font-family: 'Courier New', monospace; letter-spacing: 2px;
      animation: pulse 2s ease-in-out infinite;
    `;
    restartPrompt.textContent = "Press R or click to restart";

    wrapper.appendChild(label);
    wrapper.appendChild(scoreDisplay);
    wrapper.appendChild(bestDisplay);
    wrapper.appendChild(restartPrompt);

    this.gameOverScreen.appendChild(wrapper);
  }

  showStart(entries: LeaderboardEntry[] = []): void {
    this.startScreen.style.display = "flex";
    this.gameOverScreen.style.display = "none";
    this.scoreEl.style.display = "none";
    this.powerUpHUDEl.textContent = "";
    this.powerUpBars.clear();

    const existingMini = this.startScreen.querySelector(".mini-leaderboard");
    if (existingMini) existingMini.remove();

    if (entries.length > 0) {
      const mini = this.buildMiniLeaderboard(entries.slice(0, 3));
      mini.classList.add("mini-leaderboard");
      this.startScreen.appendChild(mini);
    }
  }

  updateScore(score: number): void {
    this.scoreEl.textContent = score.toString();
    this.scoreEl.style.animation = "none";
    void this.scoreEl.offsetWidth;
    this.scoreEl.style.animation = "popIn 0.15s ease-out";
  }

  showCombo(combo: number): void {
    if (combo <= 0) return;
    this.comboEl.textContent = `CLOSE! x${combo + 1}`;
    this.comboEl.style.display = "block";
    this.comboEl.style.opacity = "1";
    this.comboEl.style.transform = "translate(-50%, -50%) scale(1.2)";
    setTimeout(() => {
      this.comboEl.style.opacity = "0";
      this.comboEl.style.transform = "translate(-50%, -50%) scale(0.8)";
    }, 500);
    setTimeout(() => {
      this.comboEl.style.display = "none";
    }, 800);
  }

  showBossCleared(): void {
    const el = document.createElement("div");
    el.style.cssText = `
      position: absolute; top: 35%; left: 50%; transform: translateX(-50%);
      font-size: 42px; font-weight: 900; color: #FFD700;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.6);
      font-family: system-ui; z-index: 15; pointer-events: none;
      animation: slideUp 0.4s ease-out;
      white-space: nowrap;
    `;
    el.textContent = "BOSS CLEARED! +10";
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 0.5s ease-out";
      el.style.opacity = "0";
    }, 1200);
    setTimeout(() => {
      if (this.container.contains(el)) this.container.removeChild(el);
    }, 1700);
  }

  flashEdges(): void {
    const flash = document.createElement("div");
    flash.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 25;
      box-shadow: inset 0 0 60px rgba(255,255,255,0.3);
      opacity: 0.3; transition: opacity 0.2s ease-out;
    `;
    this.container.appendChild(flash);
    requestAnimationFrame(() => {
      flash.style.opacity = "0";
    });
    setTimeout(() => {
      if (this.container.contains(flash)) this.container.removeChild(flash);
    }, 200);
  }

  showBiomeName(name: string): void {
    const el = document.createElement("div");
    el.style.cssText = `
      position: absolute; top: 100px; left: 50%; transform: translateX(-50%);
      font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.9);
      text-shadow: 0 0 12px rgba(255,215,0,0.5), 1px 1px 3px rgba(0,0,0,0.7);
      font-family: 'Courier New', monospace; letter-spacing: 5px; text-transform: uppercase;
      z-index: 12; pointer-events: none; white-space: nowrap;
      animation: biomeFade 2.4s ease-in-out forwards;
    `;
    el.textContent = name;
    this.container.appendChild(el);
    setTimeout(() => {
      if (this.container.contains(el)) this.container.removeChild(el);
    }, 2500);
  }

  showBossWarning(): void {
    const el = document.createElement("div");
    el.style.cssText = `
      position: absolute; top: 28%; left: 50%; transform: translateX(-50%);
      font-size: 52px; font-weight: 900; color: #FF3333;
      text-shadow: 0 0 20px rgba(255,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9);
      font-family: system-ui; letter-spacing: 10px;
      z-index: 16; pointer-events: none; white-space: nowrap;
      animation: flashWarn 0.4s ease-in-out 4;
    `;
    el.textContent = "!! BOSS !!";
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 0.3s ease-out";
      el.style.opacity = "0";
    }, 1700);
    setTimeout(() => {
      if (this.container.contains(el)) this.container.removeChild(el);
    }, 2100);
  }

  showPowerUpHUD(type: string, remaining: number, total: number): void {
    if (this.powerUpBars.has(type)) {
      const entry = this.powerUpBars.get(type)!;
      const pct = Math.max(0, Math.min(1, remaining / total));
      entry.bar.style.width = `${pct * 100}%`;
      entry.label.textContent = this.powerUpLabel(type);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      display: flex; flex-direction: column; gap: 3px;
      animation: slideUp 0.3s ease-out;
    `;

    const labelEl = document.createElement("span");
    labelEl.style.cssText = `
      font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.8);
      font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase;
    `;
    labelEl.textContent = this.powerUpLabel(type);

    const track = document.createElement("div");
    track.style.cssText = `
      width: 100px; height: 5px; background: rgba(255,255,255,0.15);
      border-radius: 3px; overflow: hidden;
    `;

    const bar = document.createElement("div");
    const pct = Math.max(0, Math.min(1, remaining / total));
    bar.style.cssText = `
      height: 100%; width: ${pct * 100}%;
      background: ${this.powerUpColor(type)};
      border-radius: 3px;
      transition: width 0.1s linear;
    `;

    track.appendChild(bar);
    wrapper.appendChild(labelEl);
    wrapper.appendChild(track);
    this.powerUpHUDEl.appendChild(wrapper);
    this.powerUpBars.set(type, { bar, label: labelEl, wrapper });
  }

  hidePowerUpHUD(type: string): void {
    const entry = this.powerUpBars.get(type);
    if (!entry) return;
    entry.wrapper.style.transition = "opacity 0.3s ease-out";
    entry.wrapper.style.opacity = "0";
    setTimeout(() => {
      if (this.powerUpHUDEl.contains(entry.wrapper)) {
        this.powerUpHUDEl.removeChild(entry.wrapper);
      }
      this.powerUpBars.delete(type);
    }, 320);
  }

  private powerUpLabel(type: string): string {
    const labels: Record<string, string> = {
      shield: "SHIELD",
      slowmo: "SLOW-MO",
      giant: "GIANT",
      score: "2x SCORE",
    };
    return labels[type] ?? type.toUpperCase();
  }

  private powerUpColor(type: string): string {
    const colors: Record<string, string> = {
      shield: "#4FC3F7",
      slowmo: "#CE93D8",
      giant: "#FFCC02",
      score: "#A5D6A7",
    };
    return colors[type] ?? "#FFD700";
  }

  showPseudoInput(onSubmit: (name: string) => void): void {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 40; background: rgba(0,0,0,0.6);
    `;

    const box = document.createElement("div");
    box.classList.add("birdie-panel");
    box.style.cssText = `
      padding: 32px 40px; text-align: center;
      animation: slideUp 0.4s ease-out;
    `;

    const label = document.createElement("p");
    label.classList.add("birdie-text-gold");
    label.style.cssText = `
      font-size: 20px; color: #FFD700; margin: 0 0 16px;
      font-family: 'Courier New', monospace; letter-spacing: 2px;
      animation: goldGlow 1.2s ease-in-out infinite;
    `;
    label.textContent = "NEW HIGH SCORE!";

    const subLabel = document.createElement("p");
    subLabel.classList.add("birdie-text-dim");
    subLabel.style.cssText = `
      font-size: 13px; color: rgba(255,255,255,0.55); margin: 0 0 20px;
      font-family: 'Courier New', monospace; letter-spacing: 2px;
    `;
    subLabel.textContent = "ENTER YOUR NAME";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 10;
    input.placeholder = "AAA";
    input.style.cssText = `
      font-size: 28px; font-family: 'Courier New', monospace; font-weight: 900;
      text-align: center; background: transparent; border: none;
      border-bottom: 2px solid #FFD700; color: white; outline: none;
      width: 160px; letter-spacing: 8px; padding: 8px;
      text-transform: uppercase;
    `;

    const btn = document.createElement("button");
    btn.textContent = "SUBMIT";
    btn.style.cssText = `
      display: block; margin: 24px auto 0;
      font-size: 14px; font-family: 'Courier New', monospace; letter-spacing: 3px;
      background: #FFD700; color: black; border: none; padding: 10px 28px;
      cursor: pointer; font-weight: 900; border-radius: 4px;
      transition: background 0.15s;
    `;

    const submit = (): void => {
      const name = input.value.trim().toUpperCase() || "???";
      overlay.remove();
      onSubmit(name);
    };

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") submit();
    });

    box.appendChild(label);
    box.appendChild(subLabel);
    box.appendChild(input);
    box.appendChild(btn);
    overlay.appendChild(box);
    this.container.appendChild(overlay);

    setTimeout(() => input.focus(), 50);
  }

  showLeaderboard(entries: LeaderboardEntry[], onClose?: () => void): void {
    const overlay = document.createElement("div");
    overlay.classList.add("leaderboard-overlay");
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 35; padding: 20px; box-sizing: border-box;
    `;

    const panel = document.createElement("div");
    panel.classList.add("birdie-panel");
    panel.style.cssText = `
      padding: 28px 36px; min-width: 320px; max-width: 480px; width: 100%;
      animation: slideUp 0.4s ease-out;
    `;

    const title = document.createElement("h2");
    title.classList.add("birdie-text-gold");
    title.style.cssText = `
      font-size: 22px; color: #FFD700; margin: 0 0 20px;
      font-family: 'Courier New', monospace; letter-spacing: 4px; text-align: center;
    `;
    title.textContent = "TOP 10";

    const table = this.buildLeaderboardTable(entries);
    panel.appendChild(title);
    panel.appendChild(table);

    if (onClose) {
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "CONTINUE";
      closeBtn.style.cssText = `
        display: block; margin: 24px auto 0;
        font-size: 13px; font-family: 'Courier New', monospace; letter-spacing: 2px;
        background: transparent; color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.25);
        padding: 8px 24px; cursor: pointer; border-radius: 4px;
        transition: color 0.15s, border-color 0.15s;
      `;
      closeBtn.addEventListener("click", () => {
        overlay.remove();
        onClose();
      });
      panel.appendChild(closeBtn);
    }

    overlay.appendChild(panel);
    this.gameOverScreen.appendChild(overlay);
  }

  private buildLeaderboardTable(entries: LeaderboardEntry[]): HTMLElement {
    const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

    const table = document.createElement("table");
    table.style.cssText = `
      width: 100%; border-collapse: collapse;
      font-family: 'Courier New', monospace; font-size: 14px; color: white;
    `;

    const header = document.createElement("tr");
    header.style.cssText = "border-bottom: 1px solid rgba(255,215,0,0.4);";
    ["#", "NAME", "SCORE", "BIOME"].forEach((col) => {
      const th = document.createElement("th");
      th.classList.add("birdie-text-gold");
      th.style.cssText = `
        padding: 4px 8px; color: rgba(255,215,0,0.7); font-weight: normal;
        text-align: left; letter-spacing: 1px;
      `;
      th.textContent = col;
      header.appendChild(th);
    });
    table.appendChild(header);

    if (entries.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 4;
      emptyCell.classList.add("birdie-text-dim");
      emptyCell.style.cssText = `
        padding: 20px 8px; text-align: center;
        color: rgba(255,255,255,0.3); font-style: italic;
      `;
      emptyCell.textContent = "No entries yet";
      emptyRow.appendChild(emptyCell);
      table.appendChild(emptyRow);
      return table;
    }

    entries.forEach((entry, i) => {
      const row = document.createElement("tr");
      const isMedal = i < 3;
      const medalRowClasses = ["birdie-table-row-gold", "birdie-table-row-silver", "birdie-table-row-bronze"];
      if (isMedal) row.classList.add(medalRowClasses[i]);
      row.style.cssText = isMedal
        ? `background: rgba(${i === 0 ? "255,215,0" : i === 1 ? "192,192,192" : "205,127,50"},0.08);`
        : "";

      const rankCell = document.createElement("td");
      rankCell.style.cssText = `
        padding: 6px 8px; color: ${isMedal ? medalColors[i] : "rgba(255,255,255,0.4)"};
        font-weight: ${isMedal ? "900" : "normal"};
      `;
      rankCell.textContent = `${i + 1}`;

      const nameCell = document.createElement("td");
      nameCell.style.cssText = `
        padding: 6px 8px; color: ${isMedal ? medalColors[i] : "white"};
        font-weight: ${isMedal ? "900" : "normal"}; letter-spacing: 1px;
      `;
      nameCell.textContent = entry.name;

      const scoreCell = document.createElement("td");
      scoreCell.style.cssText = `
        padding: 6px 8px; color: ${isMedal ? medalColors[i] : "white"};
        font-weight: ${isMedal ? "900" : "normal"};
      `;
      scoreCell.textContent = entry.score.toString();

      const biomeCell = document.createElement("td");
      biomeCell.classList.add("birdie-text-dim");
      biomeCell.style.cssText = `
        padding: 6px 8px; color: rgba(255,255,255,0.4); font-size: 12px;
      `;
      biomeCell.textContent = entry.biome;

      row.appendChild(rankCell);
      row.appendChild(nameCell);
      row.appendChild(scoreCell);
      row.appendChild(biomeCell);
      table.appendChild(row);
    });

    return table;
  }

  private buildMiniLeaderboard(entries: LeaderboardEntry[]): HTMLElement {
    const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      margin-top: 36px; text-align: center;
      font-family: 'Courier New', monospace;
    `;

    const title = document.createElement("p");
    title.classList.add("birdie-text-gold");
    title.style.cssText = `
      font-size: 11px; color: rgba(255,215,0,0.55); letter-spacing: 4px;
      margin: 0 0 10px; text-transform: uppercase;
    `;
    title.textContent = "Best Scores";
    wrapper.appendChild(title);

    entries.forEach((entry, i) => {
      const row = document.createElement("p");
      row.style.cssText = `
        margin: 5px 0; font-size: 13px;
        color: ${medalColors[i] ?? "rgba(255,255,255,0.5)"};
        font-weight: ${i < 3 ? "900" : "normal"};
        letter-spacing: 1px;
      `;
      row.textContent = `${i + 1}. ${entry.name.padEnd(10)} ${entry.score}`;
      wrapper.appendChild(row);
    });

    return wrapper;
  }

  getMuted(): boolean {
    return this.isMuted;
  }
}
