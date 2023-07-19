const rooms = [];
const gameDetail = [];

function addUser(socketId, roomId) {
    rooms.push({ socketId, roomId });
}

function getGameDetail(room) {
    return gameDetail.find(item => item.room === room);
}

function newGame(room, userId, userName) {
    let isRoom = gameDetail.find(item => item.room === room);
    if (!isRoom) {
        let newGameDetail;
        newGameDetail = {
            room,
            user1: {
                userId,
                userName,
                moves: [],
                winCount: 0,
                inGame: false
            },
            user2: {
                userId: 0,
                userName: 0,
                moves: [],
                winCount: 0,
                inGame: false
            }
        }
        gameDetail.push(newGameDetail);
    } else {
        if(isRoom.user2.userId === 0 && isRoom.user1.userId != userId) {
            isRoom.user2.userId = userId;
            isRoom.user2.userName = userName;
        } else {
            return false;
        }
    }
    return true;
}

const winDetails = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]];

function checkWin(room, userId) {
    let _gameDetail = gameDetail.find(item => item.room === room);

    let user;
    let user_moves;
    let winCount;
    if(_gameDetail.user1.userId == userId) {
        user = 1;
        user_moves = _gameDetail.user1.moves;
    } else {
        user = 2;
        user_moves = _gameDetail.user2.moves;
    }

    let pattern;
    let isWin;
    for(let i=0; i < winDetails.length; i++) {
        let win_pattern = winDetails[i];
        isWin = true;
        for(let j=0; j < win_pattern.length; j++) {
            if(!user_moves.includes(win_pattern[j])) {
                isWin = false;
            }
        }

        if(isWin) {
            pattern = i;
            if(user === 1) {
                _gameDetail.user1.winCount += 1;
                winCount = _gameDetail.user1.winCount;
            } else{
                _gameDetail.user2.winCount += 1;
                winCount = _gameDetail.user2.winCount;
            }
            break;
        }
    }
    return {isWin, winCount, pattern};
}

function deleteRoom(room) {
    let idx = gameDetail.findIndex(item => item.room === room);
    if(idx !== -1) {
        return gameDetail.splice(idx, 1)[0];
    }
}

function userLeft(socketId) {
    if(!rooms.find(user => user.socketId === socketId)){
        return
    }
    let idx = rooms.findIndex(user => user.socketId === socketId);
    let roomId = rooms[idx].roomId;
    if(idx === -1) {
        return
    }
    rooms.splice(idx, 1)[0];
    deleteRoom(roomId);
    return roomId;
}

module.exports = {
    getGameDetail,
    newGame,
    checkWin,
    deleteRoom,
    userLeft,
    addUser,
}