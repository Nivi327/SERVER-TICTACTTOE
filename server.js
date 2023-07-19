const express = require('express');
const dotenv = require('dotenv');
const socket = require('socket.io');

const { getGameDetail, newGame, userLeft, addUser, checkWin, deleteRoom } = require('./game');

dotenv.config({ path: './config.env' });

const app = express();
const server = require('http').createServer(app);

const io = socket(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

let moves = [{ symbol: '' }, { symbol: '' }, { symbol: '' }, { symbol: '' }, { symbol: '' }, { symbol: '' }, { symbol: '' }, { symbol: '' }, { symbol: '' }, { symbol: '' }];;
// socket connections
io.on('connection', (socket) => {

    socket.on('joinRoom', (payload) => {

        addUser(socket.id, payload.roomId);

        const user = { socketId: socket.id, userName: payload.userName, roomId: payload.roomId };

        newGame(payload.roomId, payload.userId, payload.userName);

        socket.join(user.roomId);
        socket.emit('message', 'Welcome ti TIC TAC TOE');
    });

    socket.on('joinExistingRoom', (payload) => {
        addUser(socket.id, payload.roomId);

        const user = { socketId: socket.id, userName: payload.userName, roomId: payload.roomId };

        const isRoom = getGameDetail(user.roomId);

        if (!isRoom) {
            socket.emit('message', {
                error: 'Room does not exist'
            });
            return;
        }

        if (!newGame(user.roomId, payload.userId, payload.userName)) {
            socket.emit('message', { error: 'Room is full' });
            return;
        }

        socket.join(user.roomId);

        socket.emit('message', 'Welcome to TIC TAC TOE');

        socket.to(payload.roomId).emit('userJoined', `${user.userName} has joined the game`);

        return;
    });

    socket.on('userEntered', (payload) => {
        const game = getGameDetail(payload.roomId);

        if (!game) {
            return;
        }

        if (game.user1.userId === payload.userId) {
            game.user1.inGame = true;
        } else if (game.user2.userId === payload.userId) {
            game.user2.inGame = true;
        }

        if (game.user1.inGame && game.user2.inGame) {
            io.in(payload.roomId).emit('userEntered', { user1: game.user1, user2: game.user2 });
        }
    });

    socket.on('move', async (payload) => {
        const room = await getGameDetail(payload.roomId);

        console.log(room);
        if (!room.user1.userId || !room.user2.userId) {
            io.in(payload.roomId).emit('userLeave', {});
        }

        let moveCount;
        let current_user;

        if (room.user1.userId == payload.userId) {
            room.user1.moves.push(payload.move);
            moveCount = room.user1.moves.length;
            current_user = room.user1.userName;
        } else {
            room.user2.moves.push(payload.move);
            moveCount = room.user2.moves.length;
            current_user = room.user2.userName;
        }

        io.in(payload.roomId).emit('move', { move: payload.move, userId: payload.userId });

        if (moveCount >= 3) {
            const { isWin, winCount, pattern } = checkWin(payload.roomId, payload.userId);

            if (isWin) {
                io.in(payload.roomId).emit('win', { userId: payload.userId, userName: current_user, pattern });

                return;
            }

            if (room.user1.moves.length + room.user2.moves.length >= 9) {
                io.in(payload.roomId).emit('draw', { roomId: payload.roomId });
                return;
            }
        }
    })

    socket.on('reMatch', (payload) => {
        let game = getGameDetail(payload.roomId);

        game.user1.moves = [];
        game.user2.moves = [];

        io.in(payload.roomId).emit('reMatch', { game });
    })

    socket.on('removeRoom', (payload) => {

        io.in(payload.roomId).emit('removeRoom', "remove");
        deleteRoom(payload.roomId);
    })

    socket.on('disconnect', () => {
        const roomId = userLeft(socket.id);
        io.in(roomId).emit('userLeave', { roomId });
    })
})



app.get('/', (req, res) => {
    res.send('Server is Running');
})

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log("server is running");
})