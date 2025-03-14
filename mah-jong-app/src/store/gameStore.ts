import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Define types for tile and game state
export type TileType = 'wan' | 'tiao' | 'tong' | 'feng' | 'dragon';
export type TileValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type WindType = 'east' | 'south' | 'west' | 'north';
export type DragonType = 'red' | 'green' | 'white';

export interface Tile {
  id: string;
  type: TileType;
  value: TileValue | WindType | DragonType;
  isRevealed: boolean;
}

export type PlayerPosition = 'east' | 'south' | 'west' | 'north';

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  hand: Tile[];
  revealedSets: Tile[][];
  discardedTiles: Tile[];
  score: number;
  isReady: boolean;
  isConnected: boolean;
}

export interface GameState {
  gameId: string | null;
  players: Player[];
  currentPlayerIndex: number;
  wall: Tile[];
  discardPile: Tile[];
  isGameStarted: boolean;
  isGameEnded: boolean;
  lastAction: string | null;
  currentRound: number;
  dealer: PlayerPosition;
  isWaitingForAction: boolean;
  pendingActions: string[];
  winner: string | null;
  currentTurn: string | null;
  lastDiscardedTile: Tile | null;
}

export interface GameStore extends GameState {
  // Game setup actions
  createGame: () => void;
  joinGame: (playerName: string, gameId: string) => void;
  setReady: (playerId: string, isReady: boolean) => void;
  
  // Game actions
  startGame: () => void;
  drawTile: (playerId: string) => void;
  discardTile: (playerId: string, tileId: string) => void;
  claimTile: (playerId: string, action: 'peng' | 'gang' | 'hu', tileIds: string[]) => void;
  
  // Game state updates
  updatePlayerHand: (playerId: string, hand: Tile[]) => void;
  setCurrentPlayer: (playerId: string) => void;
  endGame: (winnerId: string | null) => void;
  resetGame: () => void;
  
  // Development/testing
  setupMockGame: () => void;
}

// Helper function to create tiles
const createTile = (type: TileType, value: TileValue | WindType | DragonType, isRevealed: boolean = false): Tile => ({
  id: `${type}_${value}_${Math.random().toString(36).substring(2, 9)}`,
  type,
  value,
  isRevealed,
});

// Helper function to create a full set of tiles
const createFullTileSet = (): Tile[] => {
  const tiles: Tile[] = [];
  
  // Create number tiles (wan, tiao, tong)
  ['wan', 'tiao', 'tong'].forEach(type => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(value => {
      // Each tile appears 4 times in a complete set
      for (let i = 0; i < 4; i++) {
        tiles.push(createTile(type as TileType, value as TileValue));
      }
    });
  });
  
  // Create wind tiles
  ['east', 'south', 'west', 'north'].forEach(value => {
    for (let i = 0; i < 4; i++) {
      tiles.push(createTile('feng', value as WindType));
    }
  });
  
  // Create dragon tiles
  ['red', 'green', 'white'].forEach(value => {
    for (let i = 0; i < 4; i++) {
      tiles.push(createTile('dragon', value as DragonType));
    }
  });
  
  return tiles;
};

// Fisher-Yates shuffle algorithm
const shuffleTiles = (tiles: Tile[]): Tile[] => {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Initial state for a new game
const initialState: GameState = {
  gameId: null,
  players: [],
  currentPlayerIndex: 0,
  wall: [],
  discardPile: [],
  isGameStarted: false,
  isGameEnded: false,
  lastAction: null,
  currentRound: 1,
  dealer: 'east',
  isWaitingForAction: false,
  pendingActions: [],
  winner: null,
  currentTurn: null,
  lastDiscardedTile: null,
};

// Create the store with Zustand
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Game setup actions
        createGame: () => {
          const gameId = `game-${Date.now().toString(36)}`;
          set({ gameId });
        },
        
        joinGame: (playerName, gameId) => {
          const { players } = get();
          const positions: PlayerPosition[] = ['east', 'south', 'west', 'north'];
          const availablePositions = positions.filter(
            pos => !players.some(p => p.position === pos)
          );
          
          if (availablePositions.length === 0) {
            console.error('Game is full');
            return;
          }
          
          const newPlayer: Player = {
            id: `player-${Date.now().toString(36)}`,
            name: playerName,
            position: availablePositions[0],
            hand: [],
            revealedSets: [],
            discardedTiles: [],
            score: 0,
            isReady: false,
            isConnected: true,
          };
          
          set({
            gameId,
            players: [...players, newPlayer],
          });
        },
        
        setReady: (playerId, isReady) => {
          const { players } = get();
          set({
            players: players.map(player => 
              player.id === playerId ? { ...player, isReady } : player
            ),
          });
          
          // Check if all players are ready to start the game
          const updatedPlayers = get().players;
          if (updatedPlayers.length > 1 && updatedPlayers.every(p => p.isReady)) {
            get().startGame();
          }
        },
        
        // Game actions
        startGame: () => {
          // Create and shuffle tiles
          const allTiles = shuffleTiles(createFullTileSet());
          
          // Deal tiles to players (13 tiles per player for non-dealer, 14 for dealer)
          const { players, dealer } = get();
          const updatedPlayers = [...players];
          
          let wallTiles = [...allTiles];
          
          // Deal tiles to players
          for (const player of updatedPlayers) {
            const tileCount = player.position === dealer ? 14 : 13;
            player.hand = wallTiles.splice(0, tileCount);
          }
          
          // Set initial game state
          set({
            isGameStarted: true,
            wall: wallTiles,
            players: updatedPlayers,
            currentTurn: updatedPlayers.find(p => p.position === dealer)?.id || null,
            lastAction: 'Game started',
          });
        },
        
        drawTile: (playerId) => {
          const { wall, players } = get();
          if (wall.length === 0) return;
          
          const drawnTile = wall[0];
          const remainingWall = wall.slice(1);
          
          set({
            wall: remainingWall,
            players: players.map(player => 
              player.id === playerId 
                ? { ...player, hand: [...player.hand, drawnTile] } 
                : player
            ),
            lastAction: `${players.find(p => p.id === playerId)?.name} drew a tile`,
          });
        },
        
        discardTile: (playerId, tileId) => {
          const { players } = get();
          const player = players.find(p => p.id === playerId);
          if (!player) return;
          
          const tileIndex = player.hand.findIndex(t => t.id === tileId);
          if (tileIndex === -1) return;
          
          const discardedTile = player.hand[tileIndex];
          const updatedHand = [...player.hand];
          updatedHand.splice(tileIndex, 1);
          
          set({
            players: players.map(p => 
              p.id === playerId 
                ? { 
                    ...p, 
                    hand: updatedHand, 
                    discardedTiles: [...p.discardedTiles, discardedTile] 
                  } 
                : p
            ),
            discardPile: [...get().discardPile, discardedTile],
            lastDiscardedTile: discardedTile,
            lastAction: `${player.name} discarded a tile`,
            isWaitingForAction: true, // Other players might want to claim this tile
          });
          
          // Move to next player if no claims
          // In a real implementation, this would wait for player responses
          const nextPlayerIndex = (get().currentPlayerIndex + 1) % get().players.length;
          set({
            currentPlayerIndex: nextPlayerIndex,
            currentTurn: get().players[nextPlayerIndex].id,
            isWaitingForAction: false,
          });
        },
        
        claimTile: (playerId, action, tileIds) => {
          // Implementation for claiming tiles (peng, gang, hu)
          // This would be more complex in a real implementation
          set({
            lastAction: `${get().players.find(p => p.id === playerId)?.name} performed ${action}`,
          });
          
          if (action === 'hu') {
            get().endGame(playerId);
          }
        },
        
        // Game state updates
        updatePlayerHand: (playerId, hand) => {
          const { players } = get();
          set({
            players: players.map(player => 
              player.id === playerId ? { ...player, hand } : player
            ),
          });
        },
        
        setCurrentPlayer: (playerId) => {
          const { players } = get();
          const playerIndex = players.findIndex(p => p.id === playerId);
          if (playerIndex === -1) return;
          
          set({
            currentPlayerIndex: playerIndex,
            currentTurn: playerId,
          });
        },
        
        endGame: (winnerId) => {
          set({
            isGameEnded: true,
            winner: winnerId,
            lastAction: winnerId 
              ? `${get().players.find(p => p.id === winnerId)?.name} won the game!` 
              : 'Game ended in a draw',
          });
        },
        
        resetGame: () => {
          const { players, gameId } = get();
          set({
            ...initialState,
            gameId,
            players: players.map(player => ({
              ...player,
              hand: [],
              revealedSets: [],
              discardedTiles: [],
              score: 0,
              isReady: false,
            })),
          });
        },
        
        // Development/testing function to set up a mock game with sample data
        setupMockGame: () => {
          console.log("Setting up mock game...");
          
          // Create sample players if none exist
          const { players } = get();
          let updatedPlayers = [...players];
          
          // If no players exist, create sample players
          if (updatedPlayers.length === 0) {
            const positions: PlayerPosition[] = ['east', 'south', 'west', 'north'];
            const names = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
            
            updatedPlayers = positions.map((position, index) => ({
              id: `player-${index + 1}`,
              name: names[index],
              position,
              hand: [],
              revealedSets: [],
              discardedTiles: [],
              score: 0,
              isReady: true,
              isConnected: true,
            }));
            
            // Store the current player's ID in localStorage for reference
            localStorage.setItem('currentPlayerId', updatedPlayers[0].id);
          }
          
          // Create a set of tiles
          const allTiles = shuffleTiles(createFullTileSet());
          
          // Distribute tiles to players
          for (const player of updatedPlayers) {
            // Give each player 13 tiles, except dealer who gets 14
            const tileCount = player.position === 'east' ? 14 : 13;
            player.hand = allTiles.splice(0, tileCount).map(tile => ({
              ...tile, 
              // Reveal tiles for the current player only
              isRevealed: player.id === localStorage.getItem('currentPlayerId')
            }));
          }
          
          // Add some tiles to the discard pile
          const discardPile = allTiles.splice(0, 8).map(tile => ({ ...tile, isRevealed: true }));
          
          // Important: log the new state for debugging
          const newState = {
            gameId: `mock-game-${Date.now().toString(36)}`,
            players: updatedPlayers,
            currentPlayerIndex: 0,
            wall: allTiles,
            discardPile,
            isGameStarted: true,
            currentRound: 1,
            dealer: 'east',
            currentTurn: updatedPlayers[0].id,
            lastAction: 'Demo game started',
          };
          
          console.log("Setting mock game state:", newState);
          
          // Set game state
          set(newState);
        },
      }),
      {
        name: 'mahjong-game-storage',
      }
    )
  )
); 