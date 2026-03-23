import { defineStore } from "pinia";
import { Chess } from "chess.js";
import Maia from "../lib/engine/maia";

export interface BotSettings {
  engine: "stockfish" | "maia";
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  increment: number;
  color: "white" | "black" | "random";
}

export const useBotGameStore = defineStore("botGame", {
  state: () => ({
    chess: new Chess(),
    liveFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    history: [] as any[], // { fen, san, uci, ply }
    currentStepIndex: -1, // -1 значит мы в "live" (последний ход)
    
    status: "active" as "active" | "finished",
    winner: null as string | null,
    
    settings: null as BotSettings | null,
    playerColor: "white" as "white" | "black",
    orientation: "white" as "white" | "black",

    sfWorker: null as Worker | null,
    maiaInstance: null as Maia | null,
    maiaStatus: "loading",
    maiaProgress: 0,
    isThinking: false,

    whiteTime: 600000,
    blackTime: 600000,
    lastTick: 0,
    timerInterval: null as any,
  }),

  getters: {
    // Какую позицию сейчас показывать на доске
    displayFen: (state) => {
      if (state.currentStepIndex === -1 || state.history.length === 0) {
        return state.liveFen;
      }
      return state.history[state.currentStepIndex].fen;
    },
    
    isMyTurn: (state) => {
      if (state.status !== "active" || state.currentStepIndex !== -1) return false;
      const turn = state.chess.turn() === "w" ? "white" : "black";
      return turn === state.playerColor;
    },

    hasPrevious: (state) => state.history.length > 0 && state.currentStepIndex !== 0,
    hasNext: (state) => state.currentStepIndex !== -1 && state.currentStepIndex < state.history.length - 1,
  },

  actions: {
    async setupGame(settings: BotSettings) {
      this.reset();
      this.settings = settings;
      this.playerColor = settings.color === "random" 
        ? (Math.random() > 0.5 ? "white" : "black") 
        : settings.color;
      
      this.orientation = this.playerColor;
      this.whiteTime = settings.timeLimit * 60 * 1000;
      this.blackTime = settings.timeLimit * 60 * 1000;

      if (settings.engine === "stockfish") this.initStockfish();
      else this.initMaia();

      this.startClock();
      if (this.playerColor === "black") setTimeout(() => this.triggerBotMove(), 500);
    },

    executeMove(uci: string) {
      // Если мы смотрим историю, запрещаем ходить (или возвращаемся в live)
      if (this.currentStepIndex !== -1) {
        this.currentStepIndex = -1;
      }

      try {
        const move = this.chess.move(uci);
        if (move) {
          if (this.chess.turn() === "b") this.whiteTime += (this.settings?.increment || 0) * 1000;
          else this.blackTime += (this.settings?.increment || 0) * 1000;

          const step = {
            fen: this.chess.fen(),
            san: move.san,
            uci: move.lan,
            ply: this.history.length + 1
          };
          
          this.history.push(step);
          this.liveFen = step.fen;
          this.checkGameOver();

          if (this.status === "active" && !this.isMyTurn) {
            this.triggerBotMove();
          }
        }
      } catch (e) { console.error("Invalid move", uci); }
    },

    async triggerBotMove() {
  if (this.status !== "active") return;
  this.isThinking = true;

  const plyCount = this.chess.history().length;
  const isOpening = plyCount < 10; // 10 полуходов = 5 полных ходов

  // Если дебют — ВСЕГДА Stockfish. Если нет — то что выбрал юзер.
  const currentEngine = isOpening ? "stockfish" : this.settings?.engine;

  if (currentEngine === "stockfish") {
    // Инициализируем SF, если он еще не создан (случай, когда выбрали Maia, но настал дебют)
    if (!this.sfWorker) this.initStockfish();
    
    this.sfWorker?.postMessage(`position fen ${this.chess.fen()}`);
    // В дебюте SF отвечает быстро
    this.sfWorker?.postMessage(isOpening ? "go movetime 500" : "go movetime 1000");
  } 
  else if (currentEngine === "maia") {
    if (this.maiaStatus !== 'ready') {
        // Если Maia не готова, фолбек на SF
        this.initStockfish();
        this.sfWorker?.postMessage(`position fen ${this.chess.fen()}`);
        this.sfWorker?.postMessage("go movetime 1000");
        return;
    }
    const elo = { easy: 1100, medium: 1500, hard: 1900 }[this.settings!.difficulty];
    const result = await this.maiaInstance!.evaluate(this.chess.fen(), elo, elo);
    const bestMove = Object.keys(result.policy)[0];
    setTimeout(() => this.executeMove(bestMove), 600);
  }
},

    // Навигация
    goToStep(idx: number) { this.currentStepIndex = idx; },
    goToFirst() { this.currentStepIndex = 0; },
    goToLast() { this.currentStepIndex = -1; },
    goToPrev() {
        if (this.currentStepIndex === -1) this.currentStepIndex = this.history.length - 2;
        else if (this.currentStepIndex > 0) this.currentStepIndex--;
    },
    goToNext() {
        if (this.currentStepIndex === -1) return;
        if (this.currentStepIndex === this.history.length - 1) this.currentStepIndex = -1;
        else this.currentStepIndex++;
    },

    initStockfish() {
      this.sfWorker = new Worker("/engines/stockfish-17/stockfish-17.js");
      this.sfWorker.onmessage = (e) => {
        if (e.data.startsWith("bestmove")) this.executeMove(e.data.split(" ")[1]);
      };
      this.sfWorker.postMessage("uci");
      const skill = this.settings?.difficulty === "easy" ? 0 : this.settings?.difficulty === "medium" ? 8 : 20;
      this.sfWorker.postMessage(`setoption name Skill Level value ${skill}`);
    },

    initMaia() {
      this.maiaInstance = new Maia({
        model: "https://raw.githubusercontent.com/CSSLab/maia-platform-frontend/e23a50e/public/maia2/maia_rapid.onnx",
        setStatus: (s) => this.maiaStatus = s,
        setProgress: (p) => this.maiaProgress = p,
        setError: (e) => console.error(e)
      });
    },

    startClock() {
      this.lastTick = Date.now();
      this.timerInterval = setInterval(() => {
        if (this.status !== "active") return;
        const delta = Date.now() - this.lastTick;
        this.lastTick = Date.now();
        if (this.chess.turn() === "w") this.whiteTime = Math.max(0, this.whiteTime - delta);
        else this.blackTime = Math.max(0, this.blackTime - delta);
        if (this.whiteTime === 0 || this.blackTime === 0) {
          this.status = "finished";
          this.winner = this.whiteTime === 0 ? "Black" : "White";
        }
      }, 100);
    },

    checkGameOver() {
      if (this.chess.isGameOver()) {
        this.status = "finished";
        if (this.chess.isCheckmate()) this.winner = this.chess.turn() === "w" ? "Black" : "White";
        else this.winner = "draw";
        clearInterval(this.timerInterval);
      }
    },

    reset() {
      this.chess = new Chess();
      this.liveFen = this.chess.fen();
      this.history = [];
      this.currentStepIndex = -1;
      this.status = "active";
      clearInterval(this.timerInterval);
      if (this.sfWorker) this.sfWorker.terminate();
    }
  }
});