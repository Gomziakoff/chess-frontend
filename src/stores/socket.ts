import { defineStore } from "pinia";
import { useGameStore } from "./game";

type WSMode = "lobby" | "game" | "watch";

export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null as WebSocket | null,
    mode: null as WSMode | null,
    connected: false,
    reconnectTimer: null as number | null,
    pingTimer: null as number | null,
    currentGameId: null as number | null,
    shouldReconnect: true,
    lobbyCallbacks: {} as Record<string, ((payload: any) => void)[]>,
  }),

  actions: {
    connect(mode: WSMode, gameId?: number) {

      this.mode = mode;
      this.currentGameId = gameId ?? null;

      let url = "";

      if (mode === "lobby") {
        url = "/api/v1/ws";
      }

      if (mode === "game") {
        url = `/api/v1/ws/game/${gameId}`;
      }

      if (mode === "watch") {
        url = `/api/v1/ws/watch/${gameId}`;
      }

      const host = window.location.host;

      // Определяем протокол: если зашли по https, то используем wss, иначе ws
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      const fullUrl = `${protocol}//${host}${url}`;

      console.log("Connecting to WS:", fullUrl);

      const ws = new WebSocket(fullUrl);

      ws.onopen = () => {
        console.log("WS connected:", mode);
        this.connected = true;
        

        this.send({ t: "ping" });
        this.startPing();
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
      this.stopPing();
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    },

    startPing() {
      this.stopPing();

      this.pingTimer = window.setInterval(() => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.send({ t: "ping" }); // ← отправка null
          // или this.socket.send(JSON.stringify(null));
        }
      }, 3000);
    },

    stopPing() {
      if (this.pingTimer) {
        clearInterval(this.pingTimer);
        this.pingTimer = null;
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
