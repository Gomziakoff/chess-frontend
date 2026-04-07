import { defineStore } from "pinia";
import { Chess } from "chess.js";
import { useAnalysisStore } from "./analysis";

export const useOpeningDrillStore = defineStore("openingDrill", {
  state: () => ({
    chess: new Chess(),
    status: "selecting" as "selecting" | "playing" | "completed",
    currentFen: "",
    initialFen: "",
    initialPly: 0,
    history: [] as any[],
    targetMoves: 10,
    playerMoveCount: 0,
    playerColor: "white" as "white" | "black",
    orientation: "white" as "white" | "black",
    sfWorker: null as Worker | null,
    isThinking: false,
    isAnalysisVisible: false,
  }),

  actions: {
    getPlyFromFen(fen: string): number {
      const parts = fen.split(" ");
      const moveNumber = parseInt(parts[5], 10) || 1;
      const sideToMove = parts[1];
      return (moveNumber - 1) * 2 + (sideToMove === "b" ? 1 : 0);
    },

    initDrill(fen: string, target: number, color: "white" | "black") {
      this.reset();
      const analysisStore = useAnalysisStore();
      analysisStore.stopAnalysis();

      this.status = "playing";
      this.targetMoves = target;
      this.playerColor = color;
      this.orientation = color;
      this.initialFen = fen;
      this.currentFen = fen;
      this.initialPly = this.getPlyFromFen(fen);
      this.chess.load(fen);
      this.initGameEngine();

      if ((this.chess.turn() === "w" ? "white" : "black") !== this.playerColor) {
        this.triggerBotMove();
      }
    },

    initGameEngine() {
      if (this.sfWorker) this.sfWorker.terminate();
      this.sfWorker = new Worker("/engines/stockfish-17/stockfish-17.js");
      this.sfWorker.onmessage = (e) => {
        if (e.data.startsWith("bestmove")) {
          this.applyMove(e.data.split(" ")[1], false);
          this.isThinking = false;
        }
      };
      this.sfWorker.postMessage("uci");
    },

    applyMove(uci: string, isPlayer: boolean) {
      if (this.status !== "playing") return;
      try {
        const move = this.chess.move(uci);
        if (move) {
          this.currentFen = this.chess.fen();
          this.history.push({
            fen: this.currentFen,
            san: move.san,
            uci: move.lan,
            ply: this.initialPly + this.history.length + 1
          });
          if (isPlayer) this.playerMoveCount++;
          if (this.playerMoveCount >= this.targetMoves || this.chess.isGameOver()) {
            this.finishAndAnalyze();
          } else if (isPlayer) {
            this.triggerBotMove();
          }
        }
      } catch (e) { console.error(e); }
    },

    triggerBotMove() {
      if (this.status !== "playing") return;
      this.isThinking = true;
      this.sfWorker?.postMessage(`position fen ${this.currentFen}`);
      this.sfWorker?.postMessage("go movetime 800");
    },

    async finishAndAnalyze() {
      this.status = "completed";
      if (this.sfWorker) { this.sfWorker.terminate(); this.sfWorker = null; }

      const analysisStore = useAnalysisStore();
      analysisStore.stopAnalysis();
      
      // 1. Блокируем Maia на время цикла SF
      analysisStore.isFullAnalysisRunning = true; 
      analysisStore.initFromGame(this.initialFen, this.history);
      this.isAnalysisVisible = true;

      // 2. Цикл классификации
      for (let i = 0; i < analysisStore.history.length; i++) {
  // 1. Определяем FEN до хода
  const fenBefore = i === 0 
    ? analysisStore.initialFen 
    : analysisStore.history[i - 1].fen;

  // 2. Визуально переходим на шаг назад (необязательно, но полезно для UI)
  analysisStore.goToStep(i - 1); 

  // 3. ПЕРЕДАЕМ ОБА АРГУМЕНТА (индекс и FEN)
  await analysisStore.analyzeStepSequentially(i, fenBefore); 
  
  analysisStore.fullAnalysisProgress = Math.round(((i + 1) / analysisStore.history.length) * 100);
}

      // 3. Снимаем блок и даем паузу для Wasm
      analysisStore.isFullAnalysisRunning = false;
      await new Promise(resolve => setTimeout(resolve, 600));

      try {
        await analysisStore.calculateGameLevel();
      } catch (err) { console.error("Summary error", err); }

      analysisStore.goToStep(analysisStore.history.length - 1);
    },

    reset() {
      this.status = "selecting";
      this.isAnalysisVisible = false;
      this.playerMoveCount = 0;
      this.history = [];
      if (this.sfWorker) this.sfWorker.terminate();
      this.sfWorker = null;
    }
  }
});