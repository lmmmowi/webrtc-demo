import { getRandomString } from './util.js';

class User {
    constructor(conn) {
        this.id = getRandomString(6);
        this.conn = conn;
    }

    getId() {
        return this.id;
    }

    sendCommand(cmd, data) {
        const msg = { cmd, data };
        this.conn.sendText(JSON.stringify(msg));
    }
}

export {
    User
};