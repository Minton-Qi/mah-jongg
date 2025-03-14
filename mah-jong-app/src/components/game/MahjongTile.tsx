import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Tile } from '../../store/gameStore';
import * as THREE from 'three';

// Default colors for different tile types
const tileTypeColors = {
  wan: '#ffd700', // Gold for Characters
  tiao: '#4caf50', // Green for Bamboo
  tong: '#ff5722', // Orange-red for Circles
  feng: '#2196f3', // Blue for Winds
  dragon: '#f44336', // Red for Dragons
};

interface MahjongTileProps {
  tile: Tile;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isRevealed?: boolean;
  onClick?: () => void;
}

export const MahjongTile: React.FC<MahjongTileProps> = ({
  tile,
  position,
  rotation = [0, 0, 0],
  scale = [0.5, 0.65, 0.15],
  isRevealed = false,
  onClick
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const actualIsRevealed = isRevealed || tile.isRevealed;
  
  // Determine tile color based on type
  const tileColor = useMemo(() => {
    return tileTypeColors[tile.type] || '#f3f3e0';
  }, [tile.type]);

  // Get display value for the tile
  const getTileDisplayValue = () => {
    if (typeof tile.value === 'number') {
      return String(tile.value);
    }
    
    // Map wind and dragon values to symbols
    const symbolMap: Record<string, string> = {
      'east': 'E',
      'south': 'S',
      'west': 'W',
      'north': 'N',
      'red': 'R',
      'green': 'G',
      'white': 'W'
    };
    
    return symbolMap[tile.value as string] || tile.value;
  };

  // Simple animation for interaction
  useFrame(() => {
    if (meshRef.current) {
      if (hovered && !clicked) {
        meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.005) * 0.05 + 0.1;
      } else if (!clicked) {
        // Smoothly return to original position
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          position[1],
          0.1
        );
      }
    }
  });

  const handleClick = () => {
    if (onClick) {
      setClicked(!clicked);
      onClick();
    }
  };
  
  // Create the tile's geometry and materials
  return (
    <group position={position} rotation={rotation instanceof Array ? rotation : [0, 0, 0]}>
      {/* Tile base */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        scale={scale}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={hovered ? '#fff5e6' : '#f3f3e0'} 
          roughness={0.3} 
          metalness={0.1}
          emissive={hovered ? '#ffcc80' : undefined}
          emissiveIntensity={0.2}
        />

        {/* Front face of the tile (with the tile's value) */}
        {actualIsRevealed && (
          <>
            <mesh position={[0, 0, 0.51]}>
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial color={tileColor} roughness={0.6} />
            </mesh>
            
            {/* Use Html component for text which doesn't require font loading */}
            <Html position={[0, 0, 0.52]} transform center>
              <div style={{
                color: '#000',
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                userSelect: 'none',
                fontFamily: 'Arial, sans-serif',
              }}>
                {getTileDisplayValue()}
              </div>
            </Html>
          </>
        )}

        {/* Back face of the tile */}
        {!actualIsRevealed && (
          <mesh position={[0, 0, 0.51]}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
        )}
      </mesh>
      
      {/* Selection indicator */}
      {(hovered || clicked) && (
        <mesh position={[0, position[1] - 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 16]} />
          <meshBasicMaterial color={clicked ? "#ff9900" : "#00ff00"} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}; 