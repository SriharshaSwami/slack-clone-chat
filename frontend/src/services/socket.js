import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this._errorCount = 0;
  }

  connect() {
    if (this.socket) {
      this.disconnect();
    }
    
    this._errorCount = 0;
    console.log('[Socket] Connecting to', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      // Use WebSocket-first to avoid the polling→WebSocket upgrade race condition
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this._errorCount = 0;
      console.log('[Socket] Connected with ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      this.connected = false;
      this._errorCount++;
      // Only log the first few errors to avoid console spam
      if (this._errorCount <= 3) {
        console.warn('[Socket] Connection error:', err.message);
      }
    });

    this.socket.io.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('[Socket] Disconnected by client');
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[Socket] Cannot emit ${event}, not connected.`);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

const socket = new SocketService();
export default socket;
