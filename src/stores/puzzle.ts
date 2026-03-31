import { defineStore } from 'pinia';
import axios from 'axios';
import { Chess } from 'chess.js';

export const usePuzzleStore = defineStore('puzzle', {
  state: () => ({
    puzzleId: null as string | null,
    fen: '',
    initialFen: '',
    solution: [] as string[],
    currentStep: 0,
    status: 'loading' as 'playing' | 'solved' | 'failed' | 'loading',
    historyMoves: [] as any[],
    puzzleMoves: [] as any[],
    orientation: 'white' as 'white' | 'black',
    gameInfo: null as any,
    attempts: [] as { id: string; status: 'solved' | 'failed' }[],
  }),

  actions: {
    async loadPuzzle(id: string | null) {
      this.status = 'loading';
      this.puzzleMoves = [];
      this.currentStep = 0; // Начинаем с самого первого хода в массиве solution
      
      try {
        const isNext = !id || id === 'next';
        const url = isNext 
          ? 'https://lichess.org/api/puzzle/next' 
          : `https://lichess.org/api/puzzle/${id}`;

        const res = await axios.get(url);
        const { game, puzzle } = res.data;

        const chess = new Chess();
        chess.loadPgn(game.pgn);
        
        // Загружаем историю из PGN (это ходы ДО начала тактики)
        this.historyMoves = chess.history({ verbose: true }).map((m, i) => ({
          san: m.san,
          ply: i + 1,
          uci: m.from + m.to + (m.promotion || ''),
          fen: m.after
        }));

        this.puzzleId = puzzle.id;
        this.solution = puzzle.solution;
        this.gameInfo = res.data;

        // ВАЖНО: В Lichess API PGN заканчивается прямо перед ходом игрока, 
        // ЕСЛИ первый ход решения — это ход игрока.
        this.initialFen = chess.fen();
        this.fen = chess.fen();
        
        // Чей сейчас ход по FEN, тот цвет и будет у игрока
        this.orientation = chess.turn() === 'w' ? 'white' : 'black';
        this.status = 'playing';

        return puzzle.id;
      } catch (err: any) {
        console.error("Puzzle Error:", err);
        if (id !== 'next') return this.loadPuzzle('next');
        return null;
      }
    },

    handleMove(uci: string) {
      if (this.status !== 'playing' && this.status !== 'failed') return;
      
      const expected = this.solution[this.currentStep];

      if (uci === expected) {
        // 1. Игрок сделал правильный ход
        this.applyMove(uci, 'brilliant');
        this.currentStep++;

        // Проверяем, не закончилась ли задача сразу
        if (this.currentStep >= this.solution.length) {
          this.finish('solved');
          return;
        }

        // 2. Ответ бота (следующий ход в solution)
        this.status = 'playing'; // или 'botturn'
        setTimeout(() => {
          const reply = this.solution[this.currentStep];
          this.applyMove(reply);
          this.currentStep++;

          // Проверяем, не закончилась ли задача после хода бота
          if (this.currentStep >= this.solution.length) {
            this.finish('solved');
          }
        }, 500);
        
      } else {
        // Неверный ход
        this.status = 'failed';
        const lastFen = this.puzzleMoves.length > 0 
          ? this.puzzleMoves[this.puzzleMoves.length - 1].fen 
          : this.initialFen;
        
        // Сброс позиции (flash effect)
        this.fen = '';
        setTimeout(() => { this.fen = lastFen; }, 10);
      }
    },

    applyMove(uci: string, cls?: string) {
      const currentFen = this.fen || this.initialFen;
      const chess = new Chess(currentFen);
      
      try {
        const move = chess.move({
          from: uci.substring(0, 2),
          to: uci.substring(2, 4),
          promotion: uci.length === 5 ? uci[4] : 'q'
        });

        if (move) {
          this.fen = chess.fen();
          this.puzzleMoves.push({ 
            san: move.san, 
            ply: this.historyMoves.length + this.puzzleMoves.length + 1, 
            uci, 
            fen: this.fen, 
            classification: cls 
          });
        }
      } catch (e) {
        console.error("Invalid move attempted:", uci);
      }
    },

    finish(status: 'solved' | 'failed') {
      this.status = status;
      if (this.puzzleId && !this.attempts.find(a => a.id === this.puzzleId)) {
        this.attempts.push({ id: this.puzzleId, status });
      }
    },

    resetPuzzle() {
      this.puzzleMoves = [];
      this.currentStep = 0;
      this.status = 'playing';
      this.fen = '';
      setTimeout(() => { this.fen = this.initialFen; }, 10);
    }
  }
});