var joinButton = document.getElementById('joinButton');
var leaveButton = document.getElementById('leaveButton');
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var localStream;
var socket;
var pc;
var localUserId;
var remoteUserId;

const roomId = 1;
const CMD_JOIN = 'join';
const CMD_JOIN_RESP = 'join-resp';
const CMD_LEAVE = 'leave';
const CMD_OFFER = 'offer';
const CMD_ANSWER = 'answer';
const CMD_CANDIDATE = 'candidate';
const CMD_NEW_PEER = 'new-peer';

function join() {
    var constraints = {
        audio: true,
        video: { width: 400, height: 300 },
    }
    navigator.mediaDevices.getUserMedia(constraints).then(onGetUserMedia);
}

function onGetUserMedia(stream) {
    localStream = stream;
    localVideo.srcObject = stream;

    socket = new WebSocket('ws://localhost:9999');
    socket.addEventListener('open', onSocketOpen);
    socket.addEventListener('message', onSocketMessage);
}

function onSocketOpen() {
    sendCommand(CMD_JOIN, roomId);
}

function onSocketMessage(e) {
    if (!e) return;
    // console.log('receive: ' + e.data);

    const msg = JSON.parse(e.data);
    handleCommand(msg.cmd, msg.data);
}

function leave() {
    sendCommand(CMD_LEAVE, roomId);

    var stream = localVideo.srcObject;
    stream.getTracks().forEach(track => {
        console.log('stop ' + track.kind);
        track.stop();
    });
    localVideo.srcObject = null;

    socket.close();
}

function sendCommand(cmd, data) {
    const msg = { cmd, data };
    socket.send(JSON.stringify(msg));
}

function handleCommand(cmd, data) {
    switch (cmd) {
        case CMD_JOIN_RESP:
            handleJoinResp(data);
            break;
        case CMD_NEW_PEER:
            handleRemoteNewPeer(data);
            break;
        case CMD_OFFER:
            handleRemoteOffer(data);
            break;
        case CMD_ANSWER:
            handleRemoteAnswer(data);
            break;
        case CMD_CANDIDATE:
            handleRemoteCandidate(data);
            break;
        default:
            console.log('unkown cmd ' + cmd);
    }
}

function handleJoinResp(userId) {
    localUserId = userId;
    console.log(`my user id is: ${userId}`);
}

function handleRemoteNewPeer(userId) {
    remoteUserId = userId;

    if (pc == null) {
        pc = createPeerConnection();
    }

    pc.createOffer()
        .then(localDescription => {
            setLocalDescription(localDescription);

            sendCommand(CMD_OFFER, {
                roomId,
                fromUserId: localUserId,
                remoteUserId,
                value: JSON.stringify(localDescription),
            });
        });
}

function handleRemoteOffer({ fromUserId, value }) {
    if (pc == null) {
        pc = createPeerConnection();
    }

    const remoteDescriptionn = JSON.parse(value);
    setRemoteDescription(remoteDescriptionn);

    pc.createAnswer()
        .then(localDescription => {
            setLocalDescription(localDescription);

            sendCommand(CMD_ANSWER, {
                roomId,
                fromUserId: localUserId,
                remoteUserId: fromUserId,
                value: JSON.stringify(localDescription),
            });
        });
}

function handleRemoteAnswer({ value }) {
    if (pc != null) {
        const remoteDescriptionn = JSON.parse(value);
        setRemoteDescription(remoteDescriptionn);
    }
}

function setLocalDescription(description) {
    console.log('localDescription', description);
    pc.setLocalDescription(description);
}

function setRemoteDescription(description) {
    console.log('remoteDescription', description);
    pc.setRemoteDescription(description);
}

function handleRemoteCandidate({ value }) {
    const candidate = JSON.parse(value);
    console.log('handleRemoteCandidate', candidate);
    pc.addIceCandidate(candidate).then(err => console.log('addCandidate error', err));
}

function createPeerConnection() {
    const pc = new RTCPeerConnection();
    pc.onicecandidate = handleIceCandidate;
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    return pc;
}

function handleIceCandidate(event) {
    if (!event || !event.candidate) {
        return;
    }

    const candidate = {
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
    }

    sendCommand(CMD_CANDIDATE, {
        roomId,
        fromUserId: localUserId,
        remoteUserId,
        value: JSON.stringify(candidate),
    });
}

joinButton.addEventListener('click', join);
leaveButton.addEventListener('click', leave);