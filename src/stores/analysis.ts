import { defineStore } from 'pinia';

interface EngineLine {
  depth: number;
  seldepth: number;
  multipv: number;
  score: string; // "0.25", "-1.2", "M5"
  nodes: number;
  nps: number;
  pv: string; // "e2e4 e7e5..."
  san?: string; // Если захотите конвертировать UCI в SAN
}

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    worker: null as Worker | null,
    isReady: false,
    isThinking: false,
    engineLines: [] as EngineLine[],
    depth: 0,
    evalScore: 0, // В пешках (центрипавны)
    mate: null as number | null,
    bestMove: '',
    config: {
      threads: 4,
      hash: 64,
      multiPv: 3,
      depth: 20
    }
  }),

  actions: {
    initEngine() {
      if (this.worker) return;

      // Путь к воркеру в папке public
      this.worker = new Worker('/engines/stockfish-17/stockfish-17.js');

      this.worker.onmessage = (event) => {
        const line = event.data;
        this.parseUciOutput(line);
      };

      this.sendMessage('uci');
      this.sendMessage(`setoption name MultiPV value ${this.config.multiPv}`);
      this.sendMessage(`setoption name Threads value ${this.config.threads}`);
      this.sendMessage(`setoption name Hash value ${this.config.hash}`);
      this.sendMessage('isready');
    },

    sendMessage(cmd: string) {
      this.worker?.postMessage(cmd);
    },

    analyzeFen(fen: string) {
      if (!this.worker) this.initEngine();
      
      this.isThinking = true;
      this.engineLines = [];
      this.sendMessage('stop');
      this.sendMessage(`position fen ${fen}`);
      this.sendMessage(`go depth ${this.config.depth}`);
    },

    stopAnalysis() {
      this.sendMessage('stop');
      this.isThinking = false;
    },

    parseUciOutput(line: string) {
      if (line === 'readyok') this.isReady = true;

      // Парсинг строки 'info depth ... score cp ... pv ...'
      if (line.startsWith('info') && line.includes('depth')) {
        const depthMatch = line.match(/depth (\d+)/);
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        const pvMatch = line.match(/ pv (.+)/);
        const multiPvMatch = line.match(/multipv (\d+)/);

        if (depthMatch) this.depth = parseInt(depthMatch[1]);

        if (cpMatch || mateMatch) {
          const multiPvIdx = multiPvMatch ? parseInt(multiPvMatch[1]) - 1 : 0;
          
          const info: EngineLine = {
            depth: this.depth,
            seldepth: 0,
            multipv: multiPvIdx + 1,
            score: cpMatch ? (parseInt(cpMatch[1]) / 100).toFixed(2) : `M${mateMatch![1]}`,
            nodes: 0,
            nps: 0,
            pv: pvMatch ? pvMatch[1] : ''
          };

          this.engineLines[multiPvIdx] = info;

          if (multiPvIdx === 0) {
            if (cpMatch) {
              this.evalScore = parseInt(cpMatch[1]) / 100;
              this.mate = null;
            } else if (mateMatch) {
              this.mate = parseInt(mateMatch[1]);
            }
          }
        }
      }

      if (line.startsWith('bestmove')) {
        this.bestMove = line.split(' ')[1];
        this.isThinking = false;
      }
    }
  }
});