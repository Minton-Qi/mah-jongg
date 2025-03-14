import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useTexture, Html } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { MahjongTile } from './MahjongTile';

// Fallback component when textures are loading
const TableFallback = () => (
  <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[12, 12]} />
    <meshStandardMaterial color="#0d4f0c" roughness={0.8} metalness={0.1} />
  </mesh>
);

// Loading indicator component
const LoadingIndicator = () => (
  <Html center>
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div>Loading game assets...</div>
      <div style={{ marginTop: '10px', fontSize: '12px' }}>This may take a moment</div>
    </div>
  </Html>
);

// Debug component to show game state
const DebugState = () => {
  const gameState = useGameStore();
  
  return (
    <Html position={[0, 2, 0]} center>
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'left',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxWidth: '500px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Game State:</div>
        <div>Game Started: {gameState.isGameStarted ? 'Yes' : 'No'}</div>
        <div>Player Count: {gameState.players.length}</div>
        <div>Current Player: {gameState.currentPlayerIndex}</div>
        <div>Discard Pile: {gameState.discardPile.length} tiles</div>
        {gameState.players.map((player, index) => (
          <div key={player.id} style={{ marginTop: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>Player {index + 1}: {player.name}</div>
            <div>Position: {player.position}</div>
            <div>Hand: {player.hand.length} tiles</div>
            <div>Ready: {player.isReady ? 'Yes' : 'No'}</div>
          </div>
        ))}
      </div>
    </Html>
  );
};

// The actual 3D table component
const Table = () => {
  const tableRef = useRef<THREE.Mesh>(null);
  
  // Try to load textures but provide fallbacks
  let textures;
  try {
    textures = useTexture({
      map: '/textures/table/diffuse.jpg',
      normalMap: '/textures/table/normal.jpg',
      roughnessMap: '/textures/table/roughness.jpg',
    });
  } catch (error) {
    console.warn('Could not load table textures, using fallback colors');
    // Will use default material below
  }

  // Simple animation for the table
  useFrame(() => {
    if (tableRef.current) {
      tableRef.current.rotation.y += 0.0005; // Slow down rotation
    }
  });

  return (
    <mesh ref={tableRef} receiveShadow position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 12]} />
      {textures ? (
        <meshStandardMaterial {...textures} color="#0d4f0c" roughness={0.8} metalness={0.1} />
      ) : (
        <meshStandardMaterial color="#0d4f0c" roughness={0.8} metalness={0.1} />
      )}
    </mesh>
  );
};

// Component to display a player's hand
const PlayerHand = ({ playerId, position, rotation }: { playerId: string; position: [number, number, number]; rotation: [number, number, number] }) => {
  const players = useGameStore(state => state.players);
  const player = players.find(p => p.id === playerId);
  
  if (!player) return null;

  return (
    <group position={position} rotation={rotation}>
      {/* Player label */}
      <Html position={[0, 0.5, 0]} center transform>
        <div style={{
          background: 'rgba(139, 69, 19, 0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '15px',
          fontWeight: 'bold',
        }}>
          {player.name}
        </div>
      </Html>
      
      {/* Player's tiles */}
      {player.hand.map((tile, index) => (
        <MahjongTile 
          key={tile.id}
          tile={tile}
          position={[index * 0.6 - (player.hand.length * 0.3), 0, 0]} 
          rotation={[0, 0, 0]}
          onClick={() => console.log(`Clicked tile: ${tile.id}`)}
        />
      ))}
    </group>
  );
};

// Component to display discarded tiles
const DiscardPile = ({ position }: { position: [number, number, number] }) => {
  const discardPile = useGameStore(state => state.discardPile);
  
  if (discardPile.length === 0) {
    return (
      <Html position={[position[0], position[1] + 0.5, position[2]]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          Discard Pile (Empty)
        </div>
      </Html>
    );
  }
  
  return (
    <group position={position}>
      <Html position={[0, 0.5, 0]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          Discard Pile ({discardPile.length})
        </div>
      </Html>
      
      {discardPile.map((tile, index) => {
        const row = Math.floor(index / 6);
        const col = index % 6;
        return (
          <MahjongTile 
            key={tile.id}
            tile={tile}
            position={[col * 0.6 - 1.5, 0, row * 0.6 - 1.5]} 
            rotation={[0, 0, 0]}
            isRevealed
          />
        );
      })}
    </group>
  );
};

// The main component that wraps everything
export const MahjongTable = () => {
  const players = useGameStore(state => state.players);
  const isGameStarted = useGameStore(state => state.isGameStarted);

  // Debug output 
  console.log("MahjongTable render:", { players, isGameStarted });

  return (
    <Canvas shadows dpr={[1, 2]}>
      <color attach="background" args={["#d1e5f2"]} /> {/* Lighter blue for better contrast */}
      <fog attach="fog" args={["#d1e5f2", 15, 25]} />
      
      <PerspectiveCamera makeDefault position={[0, 10, 10]} fov={50} />
      <ambientLight intensity={0.7} /> {/* Increased ambient light */}
      <pointLight position={[10, 10, 10]} intensity={1.5} castShadow /> {/* Increased intensity */}
      
      <Suspense fallback={<>
        <TableFallback />
        <LoadingIndicator />
      </>}>
        <Table />
        
        {/* Always show the debug state component */}
        <DebugState />
        
        {players.length === 0 && (
          <Html center>
            <div style={{
              background: 'rgba(255, 0, 0, 0.7)',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              No players found. Demo mode may not be working correctly.
            </div>
          </Html>
        )}
        
        {!isGameStarted && players.length > 0 && (
          <Html center>
            <div style={{
              background: 'rgba(255, 165, 0, 0.7)',
              color: 'white',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              Game has not started yet. All players need to be ready.
            </div>
          </Html>
        )}
        
        {isGameStarted && (
          <>
            {/* Player hands positioned around the table */}
            {players.map((player, index) => {
              const positions: [number, number, number][] = [
                [0, 0, 5],   // Bottom (East)
                [-5, 0, 0],  // Left (South)
                [0, 0, -5],  // Top (West)
                [5, 0, 0],   // Right (North)
              ];
              
              const rotations: [number, number, number][] = [
                [0, 0, 0],           // Bottom (East)
                [0, Math.PI / 2, 0],  // Left (South)
                [0, Math.PI, 0],      // Top (West)
                [0, -Math.PI / 2, 0], // Right (North)
              ];
              
              return (
                <PlayerHand 
                  key={player.id}
                  playerId={player.id}
                  position={positions[index % positions.length]}
                  rotation={rotations[index % rotations.length]}
                />
              );
            })}
            
            {/* Discard pile in the center */}
            <DiscardPile position={[0, 0, 0]} />
          </>
        )}
        
        <Environment preset="sunset" />
      </Suspense>
      
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}; 