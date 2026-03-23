import { defineStore } from "pinia";
import { Chess } from "chess.js";
import Maia from "../lib/engine/maia";
import { classifyMove, type MoveClassification } from "../lib/engine/describer";
import { http } from "../api/http";
import {Pgn} from "cm-pgn"

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
  classification?: MoveClassification;
  maiaProb?: number; 
  sfRank?: number;
  isSuspicious?: boolean;
}

interface MaiaResult {
  move: string;
  prob: number;
}

export const useAnalysisStore = defineStore("analysis", {
  state: () => ({
    // Состояние движка
    worker: null as Worker | null,
    isReady: false,
    isThinking: false,
    engineLines: [] as EngineLine[],
    depth: 0,
    evalScore: 0, // Абсолютный (центрипавны)
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
      multiPv: 20,
      depth: 24,
    },

    maiaInstance: null as Maia | null,
    maiaStatus: "loading" as string,
    maiaResults: [] as { move: string; prob: number }[],
    maiaElo: 1500,
    maiaProgress: 0,

    isFullAnalysisRunning: false,
    fullAnalysisProgress: 0, // Процент выполнения
    showSummary: false,
    summaryData: {
      white: { elo: 0, accuracy: 0, sfAccuracy: 0, acpl: 0, blunders: 0, mistakes: 0 },
      black: { elo: 0, accuracy: 0, sfAccuracy: 0, acpl: 0, blunders: 0, mistakes: 0 }
    },
    isCalculatingSummary: false,
    summaryProgress: 0,
  }),

  getters: {
    currentFen: (state) => state.chess.fen(),
    canGoBack: (state) => state.currentStepIndex >= 0,
    canGoForward: (state) => state.currentStepIndex < state.history.length - 1,
  },

  actions: {

  loadPgn(pgnStr: string) {
      this.pgnError = null;
      try {
        // 1. Инициализируем cm-pgn
        const pgn = new Pgn(pgnStr);

        // 2. Проверяем наличие истории ходов (согласно вашей доке: pgn.history.moves)
        if (
          !pgn.history ||
          !pgn.history.moves ||
          pgn.history.moves.length === 0
        ) {
          this.pgnError = "В предоставленном PGN не найдено ходов.";
          return false;
        }

        // 3. Маппим данные.
        // ВАЖНО: Никаких .notation! Используем move.san и move.uci напрямую.
        this.history = pgn.history.moves.map((move: any) => ({
          fen: move.fen, // FEN после этого хода
          san: move.san, // SAN нотация (например "e4")
          uci: move.uci, // UCI нотация (например "e2e4")
          ply: move.ply, // Номер полухода
          sfRank: undefined,
          maiaProb: undefined,
          isSuspicious: undefined,
        }));

        // 4. Устанавливаем начальный FEN из тегов или по умолчанию
        this.initialFen = pgn.header.tags.FEN || START_FEN;

        // 5. Синхронизируем шахматную логику (chess.js) для корректного отображения
        if (this.history.length > 0) {
          this.currentStepIndex = this.history.length - 1;
          const lastFen = this.history[this.currentStepIndex].fen;
          this.chess.load(lastFen);
        } else {
          this.currentStepIndex = -1;
          this.chess.load(this.initialFen);
        }

        console.log(`Успешно загружено ${this.history.length} ходов.`);
        return true;
      } catch (e: any) {
        console.error("Критическая ошибка cm-pgn:", e);
        // Если парсер библиотеки выкинет ошибку, мы запишем её текст
        this.pgnError = "Ошибка парсинга: " + (e.message || "Некорректный PGN");
        return false;
      }
    },

    async runHumanityAnalysis() {
  if (this.history.length === 0 || !this.maiaInstance || this.maiaStatus !== 'ready') return;
  this.isFullAnalysisRunning = true;

  for (let i = 0; i < this.history.length; i++) {
    const step = this.history[i];
    const fenBefore = i === 0 ? this.initialFen : this.history[i - 1].fen;

    try {
      const result = await this.maiaInstance.evaluate(fenBefore, this.maiaElo, this.maiaElo);
      const prob = result.policy[step.uci] || 0;
      const mProb = Math.round(prob * 100);

      // --- НОВАЯ ЛОГИКА ПОДОЗРИТЕЛЬНОСТИ ---
      let suspicious = false;

      // 1. Если это лучший ход движка, и человек играет так реже чем в 10% случаев
      if (step.sfRank === 1 && mProb < 10) suspicious = true;
      
      // 2. Если это ход из Топ-3 движка, но человек играет его крайне редко (меньше 3%)
      if (step.sfRank >= 2 && step.sfRank <= 3 && mProb < 3) suspicious = true;

      // 3. Если ход вообще не в топе Maia (0%), но это отличный ход по SF (Top-4)
      if (step.sfRank >= 1 && step.sfRank <= 4 && mProb === 0) suspicious = true;

      this.history[i] = {
        ...step,
        maiaProb: mProb,
        isSuspicious: suspicious
      };
      
      this.history = [...this.history]; // Для реактивности

    } catch (e) { console.error(e); }

    this.fullAnalysisProgress = Math.round(((i + 1) / this.history.length) * 100);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  this.isFullAnalysisRunning = false;
},

    // Вспомогательная функция для обновления sfRank в реальном времени
    updateStepSfRank(index: number) {
      const step = this.history[index];
      if (this.engineLines.length > 0) {
        const moveIndex = this.engineLines.findIndex(l => l.pv.startsWith(step.uci));
        step.sfRank = moveIndex !== -1 ? moveIndex + 1 : 0;
      }
    },
    // --- Логика шахматных ходов ---

    initNewGame() {
      this.initialFen = START_FEN;
      this.history = [];
      this.currentStepIndex = -1;
      this.chess.load(START_FEN);
      this.stopAnalysis();
      this.analyzeFen(this.initialFen);
    },

     async calculateGameLevel() {
      if (this.history.length === 0) return;
      
      this.isCalculatingSummary = true;
      const eloLevels = [1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900];
      
      const players = {
        w: { 
          maiaScores: new Array(eloLevels.length).fill(0), 
          totalLoss: 0, 
          blunders: 0, 
          mistakes: 0, 
          inaccuracies: 0,
          count: 0 
        },
        b: { 
          maiaScores: new Array(eloLevels.length).fill(0), 
          totalLoss: 0, 
          blunders: 0, 
          mistakes: 0, 
          inaccuracies: 0,
          count: 0 
        }
      };

      for (let i = 0; i < this.history.length; i++) {
        const step = this.history[i];
        const prevFen = i === 0 ? this.initialFen : this.history[i-1].fen;
        const turn = prevFen.split(' ')[1] as 'w' | 'b';
        
        // 1. Расчет для Maia (как было)
        if (this.maiaInstance && this.maiaStatus === 'ready') {
          const { result } = await this.maiaInstance.batchEvaluate(eloLevels.map(() => prevFen), eloLevels, eloLevels);
          result.forEach((res, idx) => {
            players[turn].maiaScores[idx] += (res.policy[step.uci] || 0);
          });
        }

        // 2. Расчет статистики Stockfish (на основе уже имеющейся классификации)
        // Мы предполагаем, что runFullAnalysis уже заполнил step.classification
        if (step.classification === 'blunder') players[turn].blunders++;
        if (step.classification === 'mistake') players[turn].mistakes++;
        if (step.classification === 'inaccuracy') players[turn].inaccuracies++;
        
        players[turn].count++;
      }

      const finalize = (p: typeof players.w) => {
        if (p.count === 0) return { elo: 1100, accuracy: 0, sfAccuracy: 0, blunders: 0, mistakes: 0 };
        
        // Расчет ELO Maia
        const avgMaiaScores = p.maiaScores.map(s => s / p.count);
        const maxIdx = avgMaiaScores.indexOf(Math.max(...avgMaiaScores));

        // Формула точности Stockfish (упрощенная весовая модель)
        // Best=100%, Excellent=100%, Good=80%, Inacc=50%, Mistake=20%, Blunder=0%
        const accuracyPoints = (p.count - p.inaccuracies - p.mistakes - p.blunders) * 100 
                             + (p.inaccuracies * 60) 
                             + (p.mistakes * 30)
                             + (p.blunders * 0);
        
        return {
          elo: eloLevels[maxIdx],
          accuracy: Math.round(avgMaiaScores[maxIdx] * 100), // Сходство с Maia
          sfAccuracy: Math.round(accuracyPoints / p.count), // Точность Stockfish
          blunders: p.blunders,
          mistakes: p.mistakes
        };
      };

      this.summaryData = {
        white: finalize(players.w),
        black: finalize(players.b)
      };

      this.isCalculatingSummary = false;
      this.showSummary = true;
    },

     async runFullAnalysis() {
      if (this.history.length === 0) return;
      
      this.isFullAnalysisRunning = true;
      this.fullAnalysisProgress = 0;

      // 1. Анализируем стартовую позицию
      this.goToStep(-1); // Переставляем доску в начало
      await this.analyzeStepSequentially(-1);

      // 2. Проходим по всем ходам
      for (let i = 0; i < this.history.length; i++) {
        // Проверяем, не прервал ли пользователь анализ вручную (если добавите кнопку Stop)
        if (!this.isFullAnalysisRunning) break;

        // ВАЖНО: Перемещаем "курсор" по истории. 
        // Это обновит FEN на доске, и пользователь увидит ход.
        this.goToStep(i);

        // Ждем, пока движок обсчитает текущую позицию
        await this.analyzeStepSequentially(i);
        
        // Обновляем прогресс
        this.fullAnalysisProgress = Math.round(((i + 1) / this.history.length) * 100);

        // Небольшая задержка (пауза), чтобы глаз успевал заметить ход, 
        // если движок думает очень быстро на малой глубине
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      this.isFullAnalysisRunning = false;
      await this.calculateGameLevel();
    },

    /**
     * Вспомогательный метод: ставит движок на конкретный шаг, 
     * ждет выполнения и записывает классификацию.
     */
    async analyzeStepSequentially(index: number) {
      // Запускаем стандартный метод анализа (он шлет команды в worker)
      this.analyzeFen(this.chess.fen());

      // Ждем завершения раздумий движка
      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          // Когда движок получил bestmove, он ставит isThinking = false
          if (!this.isThinking) {
            clearInterval(checkInterval);
            
            // Записываем результат классификации в историю
            if (index >= 0) {
              this.classifyHistoryStep(index);
            }
            resolve();
          }
        }, 30);
      });
    },

    classifyHistoryStep(index: number) {
  const step = this.history[index];
  const prevStepFen = index === 0 ? this.initialFen : this.history[index - 1].fen;
  const turn = prevStepFen.split(" ")[1];
  const multiplier = turn === "w" ? 1 : -1;

  if (this.engineLines.length > 0) {
    const bestLine = this.engineLines[0];
    const parseScore = (s: string): number => {
      if (s.includes("#")) return s.includes("-") ? -10000 : 10000;
      return parseFloat(s) * 100;
    };

    const bestEval = parseScore(bestLine.score) * multiplier;
    
    // Вычисляем ранг
    const moveIndex = this.engineLines.findIndex(l => l.pv.startsWith(step.uci));
    const sfRank = moveIndex !== -1 ? moveIndex + 1 : 0;
    
    let classification: MoveClassification = 'inaccuracy';
    if (sfRank === 1) {
      classification = 'best';
    } else if (moveIndex !== -1) {
      const moveEval = parseScore(this.engineLines[moveIndex].score) * multiplier;
      classification = classifyMove(moveEval, bestEval, bestEval);
    }

    // ВАЖНО: Обновляем объект целиком для реактивности
    this.history[index] = {
      ...step,
      sfRank,
      classification
    };
  }
},

    async loadGameById(id: number) {
      try {
        this.stopAnalysis();
        const res = await http.get(`/game/${id}`);
        const data = res.data;

        // Определяем начальный FEN (если партия началась не с позиции по умолчанию)
        // Если в API нет поля initialFen, используем START_FEN
        const startFen = data.Game.initialFen || START_FEN;
        
        // Мапим шаги из БД в формат стора анализа
        const historySteps = data.Steps.map((step: any) => ({
          fen: step.fen,
          san: step.san,
          uci: step.uci,
          ply: step.ply,
        }));

        // Инициализируем состояние
        this.initialFen = startFen;
        this.history = historySteps;
        this.orientation = data.Orientation?.toLowerCase() === "black" ? "black" : "white";
        
        // Устанавливаем текущую позицию на последний ход
        if (this.history.length > 0) {
          this.currentStepIndex = this.history.length - 1;
          this.chess.load(this.history[this.currentStepIndex].fen);
        } else {
          this.currentStepIndex = -1;
          this.chess.load(this.initialFen);
        }

        // Запускаем движок для текущей позиции
        this.analyzeFen(this.chess.fen());

        this.runFullAnalysis();
        
      } catch (e) {
        console.error("Failed to load game for analysis:", e);
      }
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
      const lastFen =
        this.history.length > 0
          ? this.history[this.history.length - 1].fen
          : fen;

      this.chess.load(lastFen);
      this.stopAnalysis();
      this.analyzeFen(lastFen);
    },

    makeMove(uci: string) {
      try {
        const turnBeforeMove = this.chess.turn();
        const multiplier = turnBeforeMove === "w" ? 1 : -1;

        let classification: MoveClassification | undefined;

        // Вспомогательная функция парсинга строки в число сантипешек
        const parseScore = (scoreStr: string): number => {
          if (scoreStr.includes("#")) {
            const mateIn = parseInt(scoreStr.replace("#", ""));
            return mateIn > 0 ? 10000 - mateIn : -10000 + Math.abs(mateIn);
          }
          return parseFloat(scoreStr) * 100;
        };

        if (this.engineLines.length > 0) {
          const bestLine = this.engineLines[0];

          // Лучший ход (UCI) и его оценка (POV игрока)
          const bestUci = bestLine.pv.split(" ")[0];
          const bestEval = parseScore(bestLine.score) * multiplier;

          // Ищем оценку хода, который РЕАЛЬНО сделал пользователь
          const moveLine = this.engineLines.find((l) => l.pv.startsWith(uci));

          let moveEval: number;
          if (uci === bestUci) {
            moveEval = bestEval;
            classification = "best";
          } else if (moveLine) {
            moveEval = parseScore(moveLine.score) * multiplier;
            // Сравниваем через новую функцию
            classification = classifyMove(moveEval, bestEval, bestEval);
          } else {
            // Если хода нет в ТОП-4 (MultiPV), он как минимум плохой.
            // Чтобы точнее узнать, насколько он плохой, можно
            // предположить, что он хуже 4-й линии.
            const fourthLine = this.engineLines[this.engineLines.length - 1];
            const fourthEval = parseScore(fourthLine.score) * multiplier;

            // Считаем его чуть хуже худшей линии из топа
            moveEval = fourthEval - 50;
            classification = classifyMove(moveEval, bestEval, bestEval);

            // Если после расчетов он все еще "хороший", но его нет в ТОП-4,
            // принудительно ставим Inaccuracy
            if (classification === "best" || classification === "excellent") {
              classification = "inaccuracy";
            }
          }
        }

        // Совершаем ход
        const move = this.chess.move(uci);
        if (move) {
          if (this.currentStepIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentStepIndex + 1);
          }

          const lastPly =
            this.currentStepIndex >= 0
              ? this.history[this.currentStepIndex].ply
              : this.calculateInitialPly(this.initialFen);

          this.history.push({
            fen: this.chess.fen(),
            san: move.san,
            uci: move.lan,
            ply: lastPly + 1,
            classification, // Сохраняем результат
          });

          this.currentStepIndex++;
          this.analyzeFen(this.chess.fen());
        }
      } catch (e) {
        console.error("Move error:", e);
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

      this.initMaia();
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

      if (!this.isFullAnalysisRunning) {
        this.runMaia(fen);
      } else {
        // Очищаем старые результаты Maia, чтобы они не висели на доске
        this.maiaResults = [];
      }
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
            absScoreString =
              absScore > 0 ? `+${absScore.toFixed(2)}` : absScore.toFixed(2);

            if (multiPvIdx === 0) {
              this.evalScore = absScore;
              this.mate = null;
            }
          } else if (mateMatch) {
            const mateVal = parseInt(mateMatch[1]) * multiplier;
            // Формат: #3 (белые ставят), #-3 (черные ставят)
            absScoreString =
              mateVal > 0 ? `#${Math.abs(mateVal)}` : `#-${Math.abs(mateVal)}`;

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

    initMaia() {
      if (this.maiaInstance) return;

      this.maiaInstance = new Maia({
        model: "https://raw.githubusercontent.com/CSSLab/maia-platform-frontend/e23a50e/public/maia2/maia_rapid.onnx",
        setStatus: (s) => {
          this.maiaStatus = s;
        },
        setProgress: (p) => {
          this.maiaProgress = p; // Записываем прогресс сюда
          if (p > 0 && p < 100) this.maiaStatus = 'downloading';
        },
        setError: (err) => {
          console.error("Maia Error:", err);
          this.maiaStatus = 'error';
        },
      });
    },

    async downloadMaia() {
      if (!this.maiaInstance) return;
      try {
        await this.maiaInstance.downloadModel();
      } catch (e) {
        this.maiaStatus = 'error';
      }
    },

    skipMaia() {
      this.maiaStatus = 'idle'; // Специальный статус, чтобы скрыть модалку
    },

    async runMaia(fen: string) {
      if (!this.maiaInstance || this.maiaStatus !== "ready") return;

      try {
        // Оцениваем позицию через Maia
        const result = await this.maiaInstance.evaluate(
          fen,
          this.maiaElo,
          this.maiaElo,
        );

        // Берем топ-4 хода
        this.maiaResults = Object.entries(result.policy)
          .map(([move, prob]) => ({ move, prob: prob as number }))
          .slice(0, 4);
      } catch (e) {
        console.error("Maia evaluation error:", e);
        this.maiaResults = [];
      }
    },
  },


});
