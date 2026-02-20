export class UIManager {
  private container: HTMLElement;
  private scoreEl!: HTMLElement;
  private startScreen!: HTMLElement;
  private gameOverScreen!: HTMLElement;
  private muteBtn!: HTMLElement;
  private comboEl!: HTMLElement;
  private isMuted = false;

  constructor() {
    this.container = document.getElementById("ui")!;
    this.createScoreDisplay();
    this.createStartScreen();
    this.createGameOverScreen();
    this.createMuteButton();
    this.createComboDisplay();
  }

  private createScoreDisplay(): void {
    this.scoreEl = document.createElement("div");
    this.scoreEl.style.cssText = `
      position: absolute; top: 40px; left: 50%; transform: translateX(-50%);
      font-size: 64px; font-weight: 900; color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.3);
      font-family: system-ui; z-index: 10; display: none;
      transition: transform 0.1s ease-out;
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
    title.style.cssText = `font-size: 72px; font-weight: 900; color: #FFD700; margin: 0;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.4);
      font-family: system-ui;`;
    title.textContent = "BIRDIE";

    const subtitle = document.createElement("p");
    subtitle.style.cssText = `font-size: 18px; color: rgba(255,255,255,0.7); margin-top: 16px;
      font-family: system-ui;`;
    subtitle.textContent = "A 3D Flappy Adventure";

    const prompt = document.createElement("p");
    prompt.style.cssText = `font-size: 16px; color: rgba(255,255,255,0.5); margin-top: 32px;
      font-family: system-ui; animation: pulse 2s ease-in-out infinite;`;
    prompt.textContent = "Click or press Space to play";

    this.startScreen.appendChild(title);
    this.startScreen.appendChild(subtitle);
    this.startScreen.appendChild(prompt);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      @keyframes popIn { 0% { transform: translateX(-50%) scale(1.3); } 100% { transform: translateX(-50%) scale(1); } }
      @keyframes slideUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
    `;
    document.head.appendChild(style);
    this.container.appendChild(this.startScreen);
  }

  private createGameOverScreen(): void {
    this.gameOverScreen = document.createElement("div");
    this.gameOverScreen.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: none; flex-direction: column; align-items: center; justify-content: center;
      z-index: 20; background: rgba(0,0,0,0.4);
    `;
    this.container.appendChild(this.gameOverScreen);
  }

  private createMuteButton(): void {
    this.muteBtn = document.createElement("button");
    this.muteBtn.style.cssText = `
      position: absolute; top: 16px; right: 16px;
      font-size: 24px; background: rgba(0,0,0,0.3); border: none;
      color: white; width: 44px; height: 44px; border-radius: 22px;
      cursor: pointer; z-index: 30; display: flex; align-items: center; justify-content: center;
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

  showPlaying(): void {
    this.startScreen.style.display = "none";
    this.gameOverScreen.style.display = "none";
    this.scoreEl.style.display = "block";
  }

  showGameOver(score: number, bestScore: number, isNewBest: boolean): void {
    this.scoreEl.style.display = "none";
    this.gameOverScreen.style.display = "flex";

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "text-align: center; animation: slideUp 0.5s ease-out;";

    const label = document.createElement("p");
    label.style.cssText = `font-size: 24px; color: rgba(255,255,255,0.7); margin: 0; font-family: system-ui;`;
    label.textContent = isNewBest ? "NEW HIGH SCORE!" : "GAME OVER";

    const scoreDisplay = document.createElement("p");
    scoreDisplay.style.cssText = `font-size: 72px; font-weight: 900; color: white; margin: 8px 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5); font-family: system-ui;`;
    scoreDisplay.textContent = score.toString();

    const bestDisplay = document.createElement("p");
    bestDisplay.style.cssText = `font-size: 18px; color: rgba(255,255,255,0.5); margin: 4px 0; font-family: system-ui;`;
    bestDisplay.textContent = `Best: ${bestScore}`;

    const restartPrompt = document.createElement("p");
    restartPrompt.style.cssText = `font-size: 16px; color: rgba(255,255,255,0.4); margin-top: 32px;
      font-family: system-ui; animation: pulse 2s ease-in-out infinite;`;
    restartPrompt.textContent = "Press R or click to restart";

    wrapper.appendChild(label);
    wrapper.appendChild(scoreDisplay);
    wrapper.appendChild(bestDisplay);
    wrapper.appendChild(restartPrompt);

    this.gameOverScreen.textContent = "";
    this.gameOverScreen.appendChild(wrapper);
  }

  showStart(): void {
    this.startScreen.style.display = "flex";
    this.gameOverScreen.style.display = "none";
    this.scoreEl.style.display = "none";
  }

  updateScore(score: number): void {
    this.scoreEl.textContent = score.toString();
    this.scoreEl.style.animation = "popIn 0.15s ease-out";
    setTimeout(() => {
      this.scoreEl.style.animation = "";
    }, 150);
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

  getMuted(): boolean {
    return this.isMuted;
  }
}
