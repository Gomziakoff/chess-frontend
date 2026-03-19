import { defineStore } from "pinia";
import { Chess } from "chess.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface EngineLine {
  depth: number;
  multipv: number;
  score: string; // Абсолютная строка (+1.20, -0.50, #3, #-2)
  pv: string;
}

interface AnalysisStep {
  fen: string;
  san: string;
  uci: string;
  ply: number;
}

export const useAnalysisStore = defineStore("analysis", {
  state: () => ({
    // Состояние движка
    worker: null as Worker | null,
    isReady: false,
    isThinking: false,
    engineLines: [] as EngineLine[],
    depth: 0,
    evalScore: 0,        // Абсолютный (центрипавны)
    mate: null as number | null, // Абсолютный (+ белым, - черным)
    bestMove: null as string | null,
    analyzingTurn: "w" as "w" | "b", // Сторона, которую обсчитывает движок в данный момент

    // Состояние доски
    chess: new Chess(),
    initialFen: START_FEN,
    history: [] as AnalysisStep[],
    currentStepIndex: -1,
    orientation: "white" as "white" | "black",

    config: {
      threads: 4,
      hash: 64,
      multiPv: 3,
      depth: 20,
    },
  }),

  getters: {
    currentFen: (state) => state.chess.fen(),
    canGoBack: (state) => state.currentStepIndex >= 0,
    canGoForward: (state) => state.currentStepIndex < state.history.length - 1,
  },

  actions: {
    // --- Логика шахматных ходов ---

    initNewGame() {
      this.initialFen = START_FEN;
      this.history = [];
      this.currentStepIndex = -1;
      this.chess.load(START_FEN);
      this.stopAnalysis();
      this.analyzeFen(this.initialFen);
    },

    initFromGame(fen: string, history: any[] = []) {
      this.initialFen = fen;
      this.history = history.map((h, index) => ({
        fen: h.fen,
        san: h.san,
        uci: h.uci,
        ply: h.ply || index + 1,
      }));

      this.currentStepIndex = this.history.length - 1;
      const lastFen = this.history.length > 0
          ? this.history[this.history.length - 1].fen
          : fen;

      this.chess.load(lastFen);
      this.stopAnalysis();
      this.analyzeFen(lastFen);
    },

    makeMove(uci: string) {
      try {
        const move = this.chess.move(uci);
        if (move) {
          if (this.currentStepIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentStepIndex + 1);
          }

          const lastPly = this.currentStepIndex >= 0
              ? this.history[this.currentStepIndex].ply
              : this.calculateInitialPly(this.initialFen);

          this.history.push({
            fen: this.chess.fen(),
            san: move.san,
            uci: move.lan,
            ply: lastPly + 1,
          });

          this.currentStepIndex++;
          this.analyzeFen(this.chess.fen());
        }
      } catch (e) {
        console.error("Invalid move", e);
      }
    },

    calculateInitialPly(fen: string): number {
      const parts = fen.split(" ");
      const moveNumber = parseInt(parts[5], 10) || 1;
      const sideToMove = parts[1];
      return (moveNumber - 1) * 2 + (sideToMove === "b" ? 1 : 0);
    },

    goToStep(index: number) {
      if (index === -1) {
        this.currentStepIndex = -1;
        this.chess.load(this.initialFen);
      } else if (index >= 0 && index < this.history.length) {
        this.currentStepIndex = index;
        this.chess.load(this.history[index].fen);
      }
      this.analyzeFen(this.chess.fen());
    },

    prevMove() {
      if (this.currentStepIndex >= 0) {
        this.goToStep(this.currentStepIndex - 1);
      }
    },

    nextMove() {
      if (this.currentStepIndex < this.history.length - 1) {
        this.goToStep(this.currentStepIndex + 1);
      }
    },

    // --- Логика Движка ---

    initEngine() {
      if (this.worker) return;
      this.worker = new Worker("/engines/stockfish-17/stockfish-17.js");
      this.worker.onmessage = (event) => this.parseUciOutput(event.data);

      this.sendMessage("uci");
      this.sendMessage(`setoption name MultiPV value ${this.config.multiPv}`);
      this.sendMessage("isready");
    },

    sendMessage(cmd: string) {
      this.worker?.postMessage(cmd);
    },

    analyzeFen(fen: string) {
      if (!this.isReady) return;

      // Извлекаем сторону из FEN для абсолютной оценки
      const turnPart = fen.split(" ")[1];
      this.analyzingTurn = turnPart === "b" ? "b" : "w";

      this.isThinking = true;
      this.engineLines = [];
      this.bestMove = null; 
      this.depth = 0;
      
      this.sendMessage("stop");
      this.sendMessage(`position fen ${fen}`);
      this.sendMessage(`go depth ${this.config.depth}`);
    },

    stopAnalysis() {
      this.sendMessage("stop");
      this.isThinking = false;
    },

    parseUciOutput(line: string) {
      if (line === "readyok") this.isReady = true;

      // 1. Конечный результат анализа
      if (line.startsWith("bestmove")) {
        const parts = line.split(" ");
        if (parts[1] && parts[1] !== "(none)") {
          this.bestMove = parts[1];
        }
        this.isThinking = false;
        return;
      }

      // 2. Промежуточная информация
      if (line.startsWith("info")) {
        const multiPvMatch = line.match(/multipv (\d+)/);
        const multiPvIdx = multiPvMatch ? parseInt(multiPvMatch[1]) - 1 : 0;

        // Мгновенное получение хода из PV (для стрелки)
        const pvMatch = line.match(/ pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (multiPvIdx === 0 && pvMatch) {
          this.bestMove = pvMatch[1];
        }

        const depthMatch = line.match(/depth (\d+)/);
        if (depthMatch) this.depth = parseInt(depthMatch[1]);

        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        const fullPvMatch = line.match(/ pv (.+)/);

        if (cpMatch || mateMatch) {
          // Множитель для перевода из относительной оценки в абсолютную
          const multiplier = this.analyzingTurn === "w" ? 1 : -1;

          let absScoreString = "";

          if (cpMatch) {
            const absScore = (parseInt(cpMatch[1]) / 100) * multiplier;
            absScoreString = absScore > 0 ? `+${absScore.toFixed(2)}` : absScore.toFixed(2);
            
            if (multiPvIdx === 0) {
              this.evalScore = absScore;
              this.mate = null;
            }
          } else if (mateMatch) {
            const mateVal = parseInt(mateMatch[1]) * multiplier;
            // Формат: #3 (белые ставят), #-3 (черные ставят)
            absScoreString = mateVal > 0 ? `#${Math.abs(mateVal)}` : `#-${Math.abs(mateVal)}`;
            
            if (multiPvIdx === 0) {
              this.mate = mateVal;
            }
          }

          // Обновляем список линий (EngineOutput будет брать отсюда готовые строки)
          this.engineLines[multiPvIdx] = {
            depth: this.depth,
            multipv: multiPvIdx + 1,
            score: absScoreString,
            pv: fullPvMatch ? fullPvMatch[1] : "",
          };
        }
      }
    },
  },
});