const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let players = {};

io.on('connection', (socket) => {
    console.log('Ein Spieler ist beigetreten:', socket.id);

    // Initialisiere neuen Spieler
    players[socket.id] = {
        id: socket.id,
        angle: Math.PI * 1.5,
        lat: 0,
        speed: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        stunned: 0
    };

    // Sende aktuelle Spielerliste an den neuen Spieler
    socket.emit('currentPlayers', players);

    // Informiere andere über den neuen Spieler
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Update der Spielerdaten vom Client empfangen
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].angle = movementData.angle;
            players[socket.id].lat = movementData.lat;
            players[socket.id].speed = movementData.speed;
            players[socket.id].y = movementData.y;
            // Broadcast an alle anderen
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Projektil abgefeuert
    socket.on('fireProjectile', (data) => {
        io.emit('projectileFired', { ...data, sourceId: socket.id });
    });

    // Trennung verarbeiten
    socket.on('disconnect', () => {
        console.log('Spieler hat verlassen:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});

