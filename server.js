const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Game state
const players = {};
const scores = {};
const teamScores = {
  rebels: 0,
  empire: 0,
};

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle player joining
  socket.on("player-join", (playerData) => {
    console.log("Player joined:", playerData.name, "as", playerData.faction);

    // Store player data
    players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      position: {
        x: Math.random() * 100 - 50,
        y: Math.random() * 20,
        z: Math.random() * 100 - 50,
      },
      rotation: { x: 0, y: 0, z: 0 },
      health: 100,
      score: 0,
      faction: playerData.faction,
      shipType: playerData.shipType,
    };

    scores[socket.id] = 0;

    // Send the current state to the new player
    socket.emit("game-state", { players, scores, teamScores });

    // Notify other players about the new player
    socket.broadcast.emit("player-joined", players[socket.id]);

    // Update leaderboard for all players
    io.emit("leaderboard-update", players);
  });

  // Handle player movement
  socket.on("player-move", (movementData) => {
    if (players[socket.id]) {
      players[socket.id].position = movementData.position;
      players[socket.id].rotation = movementData.rotation;

      // Broadcast the movement to other players
      socket.broadcast.emit("player-moved", {
        id: socket.id,
        position: movementData.position,
        rotation: movementData.rotation,
      });
    }
  });

  // Handle laser shooting
  socket.on("laser-shoot", (laserData) => {
    // Broadcast the laser to all other players
    socket.broadcast.emit("laser-fired", {
      id: socket.id,
      position: laserData.position,
      direction: laserData.direction,
      faction: laserData.faction,
      shipType: laserData.shipType,
    });
  });

  // Handle hit detection
  socket.on("player-hit", (hitData) => {
    const targetId = hitData.targetId;

    if (players[targetId] && players[socket.id]) {
      // Check if players are from different factions
      if (players[targetId].faction !== players[socket.id].faction) {
        // Reduce health
        players[targetId].health -= hitData.damage || 20;

        // Check if player is dead
        if (players[targetId].health <= 0) {
          // Increment shooter's score
          players[socket.id].score += 1;
          scores[socket.id] += 1;

          // Increment team score
          teamScores[players[socket.id].faction] += 1;

          // Reset target's health and position
          players[targetId].health = 100;
          players[targetId].position = {
            x: Math.random() * 100 - 50,
            y: Math.random() * 20,
            z: Math.random() * 100 - 50,
          };

          // Broadcast kill
          io.emit("player-killed", {
            killerId: socket.id,
            targetId: targetId,
            killerScore: scores[socket.id],
            killerName: players[socket.id].name,
            targetName: players[targetId].name,
            killerFaction: players[socket.id].faction,
            targetFaction: players[targetId].faction,
            teamScores: teamScores,
          });

          // Send updated position to the killed player
          io.to(targetId).emit("player-respawn", players[targetId].position);

          // Update leaderboard for all players
          io.emit("leaderboard-update", players);

          // Update team scores
          io.emit("team-scores-update", teamScores);
        } else {
          // Broadcast hit
          io.emit("player-damaged", {
            id: targetId,
            health: players[targetId].health,
          });
        }
      }
    }
  });

  // Handle leaderboard request
  socket.on("request-leaderboard", () => {
    io.emit("leaderboard-update", players);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (players[socket.id]) {
      // Notify other players
      socket.broadcast.emit("player-left", socket.id);

      // Remove player from the game
      delete players[socket.id];
      delete scores[socket.id];

      // Update leaderboard for all players
      io.emit("leaderboard-update", players);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
