# 3D Multiplayer Space Shooter

A 3D multiplayer space shooter game where players can fly ships, shoot lasers at each other, and compete for the most kills.

## Features

- 3D space environment with starfield background
- Multiplayer functionality with real-time updates
- Player name input before entering the game
- Ship movement in all directions (WASD + QE keys)
- Ship rotation (arrow keys or mouse)
- Laser shooting (spacebar or left mouse button)
- Health system with visual health bar
- Score tracking and kill feed
- Respawn after being killed

## Controls

- **W/S**: Move forward/backward
- **A/D**: Move left/right
- **Q/E**: Move up/down
- **Arrow Keys**: Rotate ship
- **Mouse Movement**: Rotate ship (when pointer is locked)
- **Spacebar/Left Mouse Button**: Shoot laser

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone this repository:

   ```
   git clone <repository-url>
   cd space-shooter
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Add a space background image:
   - Download a space background image from a free stock photo site
   - Save it as `public/assets/space-background.jpg`

## Running the Game

1. Start the server:

   ```
   npm start
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

3. Enter your name and click "Start Game"

4. Share the URL with friends to play together (they need to be on the same network or you need to expose your server to the internet)

## Multiplayer Setup

By default, the game runs on localhost, which means only players on the same machine can play together. To play with friends over the internet, you'll need to:

1. Deploy the game to a hosting service like Heroku, Glitch, or Render
2. Or use a service like ngrok to expose your local server to the internet

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering
- Socket.io for real-time multiplayer functionality
