import * as ws from 'nodejs-websocket';
import { User } from './user.js';
import * as room from './room.js';
import {
    CMD_JOIN,
    CMD_LEAVE,
    CMD_OFFER,
    CMD_ANSWER,
    CMD_CANDIDATE
} from './command.js';

const handleConnect = (conn) => {
    const user = new User(conn);
    console.log(`[${user.getId()}] CONNECTED`);

    conn.user = user;
    conn.on('text', msg => handleText(conn, msg));
    conn.on('close', () => handleClose(conn));
    conn.on('error', err => console.log(`[error] ${err}`));
};

const handleText = (conn, message) => {
    const user = conn.user;
    // console.log(`[${user.getId()}] says: ${message}`);

    const msg = JSON.parse(message);
    switch (msg.cmd) {
        case CMD_JOIN:
            room.joinRoom(msg.data, user);
            break;
        case CMD_LEAVE:
            room.leaveRoom(msg.data, user);
            break;
        case CMD_OFFER:
            room.transferOffer(msg.data, user);
            break;
        case CMD_ANSWER:
            room.transferAnswer(msg.data, user);
            break;
        case CMD_CANDIDATE:
            room.transferCandidate(msg.data, user);
            break;
        default:
            console.log('unkown cmd: ' + msg.cmd);
    }
};

const handleClose = (conn) => {
    const user = conn.user;
    console.log(`[${user.getId()}] CLOSED`);
};

const startServer = (port) => {
    const server = ws.createServer(handleConnect).listen(port);
};

export {
    startServer
};