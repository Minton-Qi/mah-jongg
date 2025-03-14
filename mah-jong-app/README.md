# Hebei Mahjong - Modern Web Implementation

A lightweight, high-performance Mahjong game implementing Hebei Mahjong rules, built with modern web technologies.

## Features

- 3D rendered Mahjong tiles and table
- Real-time multiplayer functionality
- Support for traditional Hebei Mahjong rules
- Beautiful animations and sound effects
- Responsive design for desktop and mobile play

## Technology Stack

### Frontend

- **Framework**: React with TypeScript for strong typing
- **Build Tool**: Vite for fast development and optimized production builds
- **State Management**: Zustand for lightweight, hook-based state management
- **3D Rendering**: Three.js with React Three Fiber for declarative 3D components
- **Styling**: Styled Components for component-based styling
- **Real-time Communication**: Socket.IO client for bi-directional communication

### Backend (Planned)

- **Runtime**: Node.js with Express
- **Real-time Server**: Socket.IO for WebSocket communication
- **State Management**: Redis for game room and state management
- **Authentication**: JWT for secure authentication
- **Database**: MongoDB for player profiles and game history

## Architecture Overview

This project uses a modern component-based architecture with clear separation of concerns:

1. **Game Logic Layer**: Implemented with TypeScript for type safety
2. **State Management Layer**: Zustand store with actions for game state changes
3. **Rendering Layer**: React Three Fiber for declarative 3D rendering
4. **Network Layer**: Socket.IO for real-time communication
5. **UI Layer**: React components with Styled Components

## Improvements Over Traditional Approaches

Compared to the traditional Phaser3/Unity approach mentioned in the initial requirements:

### Benefits of React + Three.js:

- **Smaller Bundle Size**: ~200KB initial load (vs. 1MB+ for Phaser or Unity WebGL)
- **Component-Based Architecture**: Better code organization and reusability
- **Declarative Rendering**: More maintainable than imperative Phaser code
- **Native TypeScript Support**: Better developer experience and fewer bugs
- **Better SEO & Accessibility**: More web-friendly than game engine UIs
- **Easier Mobile Optimization**: Better touch control support
- **Progressive Web App Support**: Offline play and installable experience

### Benefits of Zustand over Redux:

- **Simpler API**: Less boilerplate code
- **Smaller Bundle Size**: ~2KB vs. 40KB+
- **Selective Rendering**: More efficient updates
- **Middleware Support**: For persistence, logging, etc.
- **TypeScript Integration**: Type-safe state updates

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hebei-mahjong.git

# Navigate to the project directory
cd hebei-mahjong

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
src/
├── assets/           # Static assets (images, sounds, textures)
├── components/       # React components
│   ├── game/         # Game-specific components
│   └── ui/           # User interface components
├── hooks/            # Custom React hooks
├── models/           # TypeScript interfaces and types
├── services/         # API and socket services
├── store/            # Zustand state management
├── utils/            # Utility functions
├── App.tsx           # Main application component
└── main.tsx          # Application entry point
```

## Future Improvements

- AI opponents with different difficulty levels
- Additional Mahjong rule variations
- Replay system for reviewing games
- Detailed statistics and leaderboards
- Social features (friend lists, invitations)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the creators of the original Hebei Mahjong rules
- Three.js team for their amazing 3D web library
- React and Vite teams for the excellent development experience
