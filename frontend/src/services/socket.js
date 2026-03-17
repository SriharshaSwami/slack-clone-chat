import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket) {
      this.disconnect();
    }
    
    console.log('[Socket] Connecting to', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Connected with ID:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[Socket] Disconnected');
    });

    this.socket.on('connect_error', (err) => {
      this.connected = false;
      console.error('[Socket] Connection error:', err.message);
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
