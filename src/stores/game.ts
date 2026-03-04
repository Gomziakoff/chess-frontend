import { defineStore } from "pinia";
import { http } from "../api/http";
import { useSocketStore } from "./socket";

export interface PlayerInfo {
  id: number;
  username: string;
  rating: number;
  color: "white" | "black";
}

export interface ClockState {
  running: boolean;
  initial: number;
  increment: number;
  white: number;
  black: number;
}

export const useGameStore = defineStore("game", {
  state: () => ({
    gameId: null as number | null,
    status: "" as string,
    speed: "" as string,

    fen: "" as string,
    turns: 0,
    lastMove: "" as string,

    myColor: undefined as "white" | "black" | undefined,

    whitePlayer: undefined as PlayerInfo | undefined,
    blackPlayer: undefined as PlayerInfo | undefined,

    clock: null as ClockState | null,

    steps: [] as any[],
    currentStepIndex: -1,
    liveFen: "",

    winner: null as string | null,
    ratingDiff: null as any,
  }),

  getters: {
    currentFen(state) {
      if (state.currentStepIndex === -1) {
        return state.liveFen;
      }

      return state.steps[state.currentStepIndex]?.fen || state.liveFen;
    },

    hasPrevious(state) {
      return state.currentStepIndex > 0;
    },

    hasNext(state) {
      return state.currentStepIndex < state.steps.length - 1;
    },

    isLive(state) {
      return state.currentStepIndex === -1;
    },
    isMyTurn(state) {
      if (!state.fen || !state.myColor) return false;

      const turn = state.fen.split(" ")[1];
      return (
        (turn === "w" && state.myColor === "white") ||
        (turn === "b" && state.myColor === "black")
      );
    },

    orientation(state) {
      return state.myColor ?? "white";
    },

    isFinished(state) {
      return state.status === "finished";
    },
  },

  actions: {
    async loadGame(id: number) {
      this.reset();

      const res = await http.get(`/game/${id}`);
      const data = res.data;

      this.gameId = data.Game.id;
      this.speed = data.Game.speed;
      this.status = data.Game.status;
      this.fen = data.Game.fen || this.getLastStepFen(data);
      this.turns = data.Game.turns;
      this.lastMove = data.Game.lastMove;

      this.clock = data.Clock;

      this.whitePlayer = {
        id: data.White.user.id,
        username: data.White.user.username,
        rating: data.White.rating,
        color: "white",
      };

      this.blackPlayer = {
        id: data.Black.user.id,
        username: data.Black.user.username,
        rating: data.Black.rating,
        color: "black",
      };

      this.steps = Array.isArray(data.Steps)
    ? data.Steps
    : []
      this.liveFen = this.fen;

      this.currentStepIndex =
        this.steps.length > 0 ? this.steps.length - 1 : -1;

      this.myColor = data.Orientation?.toLowerCase() ?? null;
    },

    getLastStepFen(data: any) {
      const START_FEN =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

      if (!data.Steps?.length) {
        return START_FEN;
      }
      return data.Steps[data.Steps.length - 1].fen;
    },

    sendMove(uci: string) {
      if (!this.isMyTurn) return;
      if (this.status === "finished") return;

      const socket = useSocketStore();

      socket.send({
        t: "move",
        d: {
          u: uci,
          a: this.turns + 1,
        },
      });
    },

    handleWSMessage(msg: any) {
      switch (msg.t) {
        case "move":
          this.applyMove(msg.d);
          break;
        case "EndData":
          this.applyEnd(msg.d);
          break;
      }
    },

    applyMove(data: any) {
      console.log(data);
      this.fen = data.fen;
      this.lastMove = data.uci;
      this.turns = data.Ply;

      if (this.clock) {
        this.clock.white = data.clock.white;
        this.clock.black = data.clock.black;
      }

      if (!Array.isArray(this.steps)) {
        console.warn("steps was not an array, resetting to empty array");
        this.steps = [];
      }
      this.liveFen = data.fen;
      this.currentStepIndex = this.steps.length;

      this.steps.push({
        ply: data.ply,
        uci: data.uci,
        san: data.san,
        fen: data.fen,
      });
    },
    goToStep(index: number) {
      if (index < 0) {
        this.currentStepIndex = -1;
        this.fen = this.liveFen;
        return;
      }

      if (index >= this.steps.length) return;

      this.currentStepIndex = index;
      this.fen = this.steps[index].fen;
    },

    goToFirst() {
      if (this.steps.length === 0) return;

      this.currentStepIndex = 0;
      this.fen = this.steps[0].fen;
    },

    goToLast() {
      this.currentStepIndex = this.steps.length - 1;
      this.fen = this.liveFen;
    },

    goToNext() {
      if (this.currentStepIndex === -1) return;

      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;

        this.fen = this.steps[this.currentStepIndex].fen;
      }
    },

    goToPrevious() {
      if (this.currentStepIndex <= 0) return;

      this.currentStepIndex--;

      this.fen = this.steps[this.currentStepIndex].fen;
    },

    applyEnd(data: any) {
      this.status = "finished";
      this.winner = data.Winner;
      this.ratingDiff = data.RatingDiff;

      if (this.clock) {
        this.clock.running = false;
        this.clock.white = data.clock.white;
        this.clock.black = data.clock.black;
      }
    },

    reset() {
      this.gameId = null;
      this.status = "";
      this.speed = "";
      this.fen = "";
      this.turns = 0;
      this.lastMove = "";
      this.myColor = undefined;
      this.whitePlayer = undefined;
      this.blackPlayer = undefined;
      this.clock = null;
      this.steps = [];
      this.winner = null;
      this.ratingDiff = null;
    },
  },
});
