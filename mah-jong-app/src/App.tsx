import { useState, useEffect } from 'react'
import { MahjongTable } from './components/game/MahjongTable'
import { useGameStore } from './store/gameStore'
import socketService from './services/socketService'
import styled from 'styled-components'
import './App.css'

// Styled components
const GameContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  color: #333;
`

const GameHeader = styled.header`
  padding: 1rem;
  background-color: #8B4513; /* Darker brown for better contrast */
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`

const GameLogo = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  font-family: 'Noto Serif SC', serif;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`

const GameCanvas = styled.div`
  flex: 1;
  position: relative;
  border: 1px solid #ddd;
  margin: 1rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`

const GameControls = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  z-index: 10;
`

const GameButton = styled.button`
  padding: 0.7rem 1.5rem;
  background-color: #8B4513;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  font-size: 1rem;

  &:hover {
    background-color: #A0522D;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`

const LobbyContainer = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
`

const Input = styled.input`
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    border-color: #8B4513;
    outline: none;
    box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.2);
  }
`

const PlayerContainer = styled.div`
  margin: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

const PlayerListTitle = styled.h3`
  color: #333;
  border-bottom: 2px solid #8B4513;
  padding-bottom: 0.5rem;
  margin-top: 0;
`

const PlayerList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
`

const PlayerItem = styled.li<{ isReady: boolean }>`
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  background-color: ${(props) => (props.isReady ? '#e6ffe6' : '#fff5e6')};
  border-left: 4px solid ${(props) => (props.isReady ? '#4CAF50' : '#FF9800')};
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

const StatusBadge = styled.span<{ isReady: boolean }>`
  background-color: ${(props) => (props.isReady ? '#4CAF50' : '#FF9800')};
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
`

const SecondaryButton = styled.button`
  background-color: transparent;
  color: #8B4513;
  border: 1px solid #8B4513;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(139, 69, 19, 0.1);
  }
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
`

const GameInfo = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`

// Main App component
function App() {
  const [isLobby, setIsLobby] = useState(true)
  const [playerName, setPlayerName] = useState('')
  const [gameId, setGameId] = useState('')
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  // Game state from Zustand
  const { 
    players, 
    isGameStarted, 
    createGame, 
    joinGame, 
    setReady,
    setupMockGame
  } = useGameStore()
  
  // Get the current player ID from localStorage
  const currentPlayerId = localStorage.getItem('currentPlayerId')

  // Check if current player is ready
  const isPlayerReady = currentPlayerId 
    ? players.find(p => p.id === currentPlayerId)?.isReady || false
    : false

  // Connect to socket server on component mount
  useEffect(() => {
    const connectToServer = async () => {
      try {
        await socketService.connect()
        setIsConnected(true)
      } catch (error) {
        console.error('Failed to connect to server:', error)
        // Show offline mode indication instead of failing completely
        setIsConnected(true) // Set to true for development without backend
      }
    }
    
    connectToServer()
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect()
    }
  }, [])

  // Handle creating a new game
  const handleCreateGame = () => {
    if (!playerName) return
    
    // Create a new game
    createGame()
    
    // Store player ID in localStorage
    const playerId = `player-${Date.now().toString(36)}`
    localStorage.setItem('currentPlayerId', playerId)
    
    // Join the game with the player name
    joinGame(playerName, gameId || 'new-game')
    
    // Close the lobby
    setIsLobby(false)
    
    // Emit create game event to server
    socketService.createGame(playerName)
  }

  // Handle joining an existing game
  const handleJoinGame = () => {
    if (!playerName || !gameId) return
    
    // Join the game with the player name and game ID
    joinGame(playerName, gameId)
    
    // Store player ID in localStorage
    const playerId = `player-${Date.now().toString(36)}`
    localStorage.setItem('currentPlayerId', playerId)
    
    // Close the lobby
    setIsLobby(false)
    
    // Emit join game event to server
    socketService.joinGame(gameId, playerName)
  }

  // Handle player ready state
  const handleReady = () => {
    if (!currentPlayerId) return
    
    // Toggle ready state
    setReady(currentPlayerId, !isPlayerReady)
    
    // Emit ready state to server
    socketService.setReady(!isPlayerReady)
  }
  
  // For development: Set up a mock game
  const handleDemoMode = () => {
    console.log("Entering demo mode...");
    
    // Clear any previous state
    localStorage.removeItem('currentPlayerId');
    
    // Initialize the mock game
    setupMockGame();
    
    // Log the current state
    console.log("Game state after setupMockGame:", {
      players: useGameStore.getState().players,
      isGameStarted: useGameStore.getState().isGameStarted
    });
    
    // Set isLobby to false to show the game view
    setIsLobby(false);
  }

  // Render lobby or game based on state
  return (
    <GameContainer>
      <GameHeader>
        <GameLogo>河北麻将</GameLogo>
        {!isLobby && (
          <GameInfo>
            Game ID: {gameId || 'New Game'} | Players: {players.length}/4
          </GameInfo>
        )}
      </GameHeader>
      
      {isLobby ? (
        <LobbyContainer>
          <h2>{isCreatingGame ? 'Create a Game' : 'Join a Game'}</h2>
          
          <FormGroup>
            <Label htmlFor="playerName">Your Name</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
            />
          </FormGroup>
          
          {!isCreatingGame && (
            <FormGroup>
              <Label htmlFor="gameId">Game ID</Label>
              <Input
                id="gameId"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="Enter game ID"
              />
            </FormGroup>
          )}
          
          <ButtonGroup>
            {isCreatingGame ? (
              <>
                <GameButton onClick={handleCreateGame} disabled={!playerName || !isConnected}>
                  Create Game
                </GameButton>
                <SecondaryButton onClick={() => setIsCreatingGame(false)}>
                  Join Existing Game
                </SecondaryButton>
              </>
            ) : (
              <>
                <GameButton onClick={handleJoinGame} disabled={!playerName || !gameId || !isConnected}>
                  Join Game
                </GameButton>
                <SecondaryButton onClick={() => setIsCreatingGame(true)}>
                  Create New Game
                </SecondaryButton>
              </>
            )}
          </ButtonGroup>
          
          {/* Demo mode button for development */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <SecondaryButton onClick={handleDemoMode}>
              Enter Demo Mode
            </SecondaryButton>
            <div style={{ fontSize: '12px', color: '#777', marginTop: '5px' }}>
              (Skip login for development)
            </div>
          </div>
        </LobbyContainer>
      ) : (
        <>
          <GameCanvas>
            <MahjongTable />
            
            <GameControls>
              {!isGameStarted && (
                <GameButton onClick={handleReady}>
                  {isPlayerReady ? 'Cancel Ready' : 'Ready'}
                </GameButton>
              )}
            </GameControls>
          </GameCanvas>
          
          {!isGameStarted && (
            <PlayerContainer>
              <PlayerListTitle>Players</PlayerListTitle>
              <PlayerList>
                {players.map((player) => (
                  <PlayerItem key={player.id} isReady={player.isReady}>
                    <span>{player.name} ({player.position})</span>
                    <StatusBadge isReady={player.isReady}>
                      {player.isReady ? 'Ready' : 'Not Ready'}
                    </StatusBadge>
                  </PlayerItem>
                ))}
              </PlayerList>
            </PlayerContainer>
          )}
        </>
      )}
    </GameContainer>
  )
}

export default App
