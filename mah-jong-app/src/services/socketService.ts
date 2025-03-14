import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

// Define the types of events we can send and receive
export interface ServerToClientEvents {
  playerJoined: (playerId: string, playerName: string) => void;
  playerLeft: (playerId: string) => void;
  gameStarted: (initialState: any) => void;
  playerAction: (playerId: string, action: string, payload: any) => void;
  updateGameState: (gameState: any) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  leaveGame: () => void;
  setReady: (isReady: boolean) => void;
  startGame: () => void;
  drawTile: () => void;
  discardTile: (tileId: string) => void;
  claimTile: (action: 'peng' | 'gang' | 'hu', tileIds: string[]) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private isConnected = false;

  // Initialize the socket connection
  connect(serverUrl: string = 'http://localhost:3001'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });
    });
  }

  // Close the socket connection
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Set up event listeners for game events
  private setupEventListeners() {
    if (!this.socket) return;

    // Handle player joining
    this.socket.on('playerJoined', (playerId, playerName) => {
      console.log(`Player joined: ${playerName} (${playerId})`);
      // Update game state
    });

    // Handle player leaving
    this.socket.on('playerLeft', (playerId) => {
      console.log(`Player left: ${playerId}`);
      // Update game state
    });

    // Handle game start
    this.socket.on('gameStarted', (initialState) => {
      console.log('Game started', initialState);
      // Update game state with initial state
    });

    // Handle player actions
    this.socket.on('playerAction', (playerId, action, payload) => {
      console.log(`Player ${playerId} performed ${action}`, payload);
      
      // Update game state based on action
      const gameStore = useGameStore.getState();
      
      switch (action) {
        case 'draw':
          gameStore.drawTile(playerId);
          break;
        case 'discard':
          gameStore.discardTile(playerId, payload.tileId);
          break;
        case 'claim':
          gameStore.claimTile(playerId, payload.claimType, payload.tileIds);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    });

    // Handle game state updates
    this.socket.on('updateGameState', (gameState) => {
      console.log('Game state updated', gameState);
      // Update the entire game state
    });

    // Handle errors
    this.socket.on('error', (message) => {
      console.error('Server error:', message);
      // Display error to user
    });
  }

  // Methods to send events to the server
  createGame(playerName: string) {
    this.socket?.emit('createGame', playerName);
  }

  joinGame(gameId: string, playerName: string) {
    this.socket?.emit('joinGame', gameId, playerName);
  }

  leaveGame() {
    this.socket?.emit('leaveGame');
  }

  setReady(isReady: boolean) {
    this.socket?.emit('setReady', isReady);
  }

  startGame() {
    this.socket?.emit('startGame');
  }

  drawTile() {
    this.socket?.emit('drawTile');
  }

  discardTile(tileId: string) {
    this.socket?.emit('discardTile', tileId);
  }

  claimTile(action: 'peng' | 'gang' | 'hu', tileIds: string[]) {
    this.socket?.emit('claimTile', action, tileIds);
  }

  // Helper method to check connection status
  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Create and export a singleton instance
export const socketService = new SocketService();
export default socketService; 