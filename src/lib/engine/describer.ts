import { Chess } from "chess.js";

export interface DescriptionSegment {
  type: 'text' | 'move';
  content: string;
  uci?: string;
}

const textSeg = (content: string): DescriptionSegment => ({ type: 'text', content });
const moveSeg = (san: string, uci: string): DescriptionSegment => ({ type: 'move', content: san, uci });

const OUTCOME = {
  overwhelming: {
    sing: ['дает подавляющее преимущество', 'обеспечивает решающий перевес'],
    plur: ['дают подавляющее преимущество', 'обеспечивают решающий перевес'],
  },
  win: {
    sing: ['ведет к победе', 'дает серьезное преимущество'],
    plur: ['ведут к победе', 'дают серьезное преимущество'],
  },
  advantage: {
    sing: ['создает давление', 'дает приятный перевес'],
    plur: ['создают давление', 'дают приятный перевес'],
  },
  balance: {
    sing: ['сохраняет равенство', 'поддерживает баланс'],
    plur: ['сохраняют равенство', 'поддерживают баланс'],
  },
  hold: {
    sing: ['позволяет удерживать позицию', 'защищает позицию'],
    plur: ['позволяют удерживать позицию', 'защищают позицию'],
  },
  stay: {
    sing: ['оставляет шансы на борьбу', 'позволяет остаться в игре'],
    plur: ['оставляют шансы на борьбу', 'позволяют остаться в игре'],
  },
} as const;

// Шансы на победу от 0 до 1
const winRate = (p: number): number => 1 / (1 + Math.exp(-(p) / 0.8));

const hash32 = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x1000193);
  return h >>> 0;
};

const makePicker = (seed: number) => {
  let s = seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
  return <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)] ?? arr[0];
};

export function describePosition(
  fen: string,
  sfEvals: Record<string, number>, // Эти числа всегда POV Белые (как в Store)
  whiteToMove: boolean
): { segments: DescriptionSegment[] } {
  const pick = makePicker(hash32(fen));
  const chess = new Chess(fen);
  
  const moves = Object.keys(sfEvals);
  if (!moves.length) return { segments: [textSeg('Ожидание анализа движка...')] };

  // --- ВАЖНОЕ ИСПРАВЛЕНИЕ: ПЕРСПЕКТИВА ---
  // Для того, кто ходит, "лучший" ход — это тот, который максимизирует ЕГО выгоду.
  const pov = whiteToMove ? 1 : -1;
  
  // Создаем карту оценок "с точки зрения ходящего" (Score Relative to Player)
  const relEvals: Record<string, number> = {};
  moves.forEach(m => {
    relEvals[m] = sfEvals[m] * pov; 
  });

  // Теперь лучший ход (opt) — это всегда МАКСИМУМ в relEvals
  const opt = moves.reduce((a, b) => (relEvals[a] > relEvals[b] ? a : b));
  
  // Шансы на победу для лучшего хода
  const winProbOpt = winRate(relEvals[opt] / 100);
  
  // Хорошие ходы (с потерей не более 8% шансов на победу)
  const sortedGood = moves
    .filter(m => {
      const winProbM = winRate(relEvals[m] / 100);
      return (winProbOpt - winProbM) <= 0.08;
    })
    .sort((a, b) => relEvals[b] - relEvals[a]);

  const nGood = sortedGood.length;

  // Категория определяется по тому, насколько хороша позиция при ЛУЧШЕМ ходе
  const bestRelScore = relEvals[opt] / 100;
  const category = 
      bestRelScore > 3 ? 'overwhelming' : 
      bestRelScore > 1.2 ? 'win' : 
      bestRelScore > 0.4 ? 'advantage' : 
      bestRelScore >= -0.4 ? 'balance' : 
      bestRelScore >= -1.2 ? 'hold' : 'stay';

  const toSan = (uci: string) => {
    try {
      const m = chess.move(uci);
      const san = m.san;
      chess.undo();
      return san;
    } catch { return uci; }
  };

  const segments: DescriptionSegment[] = [];

  // Формируем текст
  if (nGood === 1) {
    segments.push(textSeg('Только ход '), moveSeg(toSan(opt), opt));
  } else if (nGood === 2) {
    segments.push(textSeg('Ходы '), moveSeg(toSan(sortedGood[0]), sortedGood[0]), textSeg(' и '), moveSeg(toSan(sortedGood[1]), sortedGood[1]));
  } else {
    segments.push(textSeg('Лучшие продолжения — '), moveSeg(toSan(sortedGood[0]), sortedGood[0]), textSeg(', '), moveSeg(toSan(sortedGood[1]), sortedGood[1]));
  }

  const outcomeStr = nGood === 1 ? pick(OUTCOME[category].sing) : pick(OUTCOME[category].plur);
  segments.push(textSeg(` ${outcomeStr}. `));

  // Ловушки (Ищем ход, который сильно роняет шансы)
  const worstMove = moves
    .filter(m => !sortedGood.includes(m))
    .sort((a, b) => relEvals[b] - relEvals[a])[0]; // берем "почти хороший", но плохой ход

  if (worstMove) {
    const loss = winProbOpt - winRate(relEvals[worstMove] / 100);
    if (loss > 0.15) {
      segments.push(textSeg(` Будьте бдительны: ход `), moveSeg(toSan(worstMove), worstMove), textSeg(' был бы серьезной ошибкой.'));
    }
  }

  return { segments };
}