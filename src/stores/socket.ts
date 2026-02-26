import { defineStore } from "pinia";
import { useGameStore } from "./game";

type WSMode = "lobby" | "game" | "watch";

export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null as WebSocket | null,
    mode: null as WSMode | null,
    connected: false,
    reconnectTimer: null as number | null,
    currentGameId: null as number | null,
    shouldReconnect: true,
    lobbyCallbacks: {} as Record<string, ((payload: any) => void)[]>,
  }),

  actions: {
    connect(mode: WSMode, gameId?: number) {
      this.disconnect();

      this.mode = mode;
      this.currentGameId = gameId ?? null;

      let url = "";

      if (mode === "lobby") {
        url = "ws://localhost:8080/api/v1/ws";
      }

      if (mode === "game") {
        url = `ws://localhost:8080/api/v1/ws/game/${gameId}`;
      }

      if (mode === "watch") {
        url = `ws://localhost:8080/api/v1/ws/watch/${gameId}`;
      }

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("WS connected:", mode);
        this.connected = true;
      };

      ws.onclose = () => {
        console.log("WS closed");
        this.connected = false;
        if (this.shouldReconnect) {
          this.tryReconnect();
        }
      };

      ws.onerror = (err) => {
        console.error("WS error:", err);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.socket = ws;
    },

    disconnect() {
      this.shouldReconnect = false;
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    },

    send(data: any) {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.warn("WS not connected");
        return;
      }

      this.socket.send(JSON.stringify(data));
    },

    tryReconnect() {
      if (!this.mode) return;

      this.reconnectTimer = window.setTimeout(() => {
        console.log("Reconnecting...");
        this.connect(this.mode!, this.currentGameId ?? undefined);
      }, 2000);
    },

    handleMessage(data: any) {
      console.log("WS message:", data);

      if (this.mode === "game") {
        const gameStore = useGameStore();
        gameStore.handleWSMessage(data);
        return;
      }

      if (this.mode === "lobby" && data?.t) {
        const handlers = this.lobbyCallbacks[data.t];
        if (handlers) {
          handlers.forEach((h) => h(data.d));
        }
      }
    },

    setLobbyCallback(eventType: string, handler: (payload: any) => void) {
      if (!this.lobbyCallbacks[eventType]) {
        this.lobbyCallbacks[eventType] = [];
      }
      this.lobbyCallbacks[eventType].push(handler);
    },

    removeLobbyCallback(eventType: string, handler: (payload: any) => void) {
      const handlers = this.lobbyCallbacks[eventType];
      if (handlers) {
        this.lobbyCallbacks[eventType] = handlers.filter((h) => h !== handler);
      }
    },
  },
});
