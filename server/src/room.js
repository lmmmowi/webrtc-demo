import {
    CMD_JOIN_RESP,
    CMD_NEW_PEER,
    CMD_OFFER,
    CMD_ANSWER,
    CMD_CANDIDATE,
    CMD_LEAVE_PEER
} from './command.js';

const roomMap = new Map();

const createRoom = (roomId) => {
    const room = {
        id: roomId,
        name: `room-${roomId}`,
        users: new Map()
    };
    roomMap.set(roomId, room);
    console.log(`[SYSTEM] room created: ${room.name}`);
    return room;
};

const destroyRoom = (roomId) => {
    const room = roomMap.get(roomId);
    if (room) {
        roomMap.delete(roomId);
        console.log(`[SYSTEM] room destroyed: ${room.name}`);
    }
};

const joinRoom = (roomId, user) => {
    let room = roomMap.get(roomId);
    if (!room) {
        room = createRoom(roomId);
    }

    const userId = user.getId();
    if (room.users.get(userId)) {
        return;
    }

    room.users.set(userId, user);
    console.log(`[SYSTEM] user(${userId}) join ${room.name}`);

    user.sendCommand(CMD_JOIN_RESP, userId);
    room.users.forEach(o => {
        if (o !== user) {
            o.sendCommand(CMD_NEW_PEER, userId);
        }
    });
};

const leaveRoom = (roomId, user) => {
    const room = roomMap.get(roomId);
    if (!room) {
        return;
    }

    const userId = user.getId();
    room.users.delete(userId);
    console.log(`[SYSTEM] user(${userId}) leave ${room.name}`);

    if (room.users.size == 0) {
        destroyRoom(roomId);
    }
    else {
        room.users.forEach(o => {
            if (o !== user) {
                o.sendCommand(CMD_LEAVE_PEER, userId);
            }
        });
    }
};

const transferOffer = (data, user) => {
    doTransferData(data, user, CMD_OFFER);
};

const transferAnswer = (data, user) => {
    doTransferData(data, user, CMD_ANSWER);
};

const transferCandidate = (data, user) => {
    doTransferData(data, user, CMD_CANDIDATE);
};

const doTransferData = (data, user, cmd) => {
    const { roomId, remoteUserId } = data;
    const room = roomMap.get(roomId);
    if (!room) {
        return;
    }

    const remoteUser = room.users.get(remoteUserId);
    if (!remoteUser) {
        return;
    }

    console.log(`[SYSTEM] user(${user.getId()}) try to transfer ${cmd} to remote user(${remoteUser.getId()})`)
    remoteUser.sendCommand(cmd, data);
};

export {
    joinRoom,
    leaveRoom,
    transferOffer,
    transferAnswer,
    transferCandidate,
};