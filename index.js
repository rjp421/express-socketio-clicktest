const path = require('path');
const http = require('http');
const UUID = require("uuid");

const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {cors: { origin: "*"}});


const port = 8080;
const connectedUsersObj = {};
const points = [];

app.disable('etag').disable('x-powered-by');

app.get('/', onHTTPGetHandler);
app.get('/clicks', onHTTPGetHandler);


server.listen(port, function listenHandler() {
    console.log(`Lisetning on port ${port}`)
});


function onHTTPGetHandler(req, res) {
    console.log(req.path);
    switch (req.path) {
        case '/':
            res.sendFile(path.join(__dirname, 'index.html'));
            break;
        case '/clicks':
            res.sendFile(path.join(__dirname, 'clicks.html'));
            break;
        default:
            // send 404
            break;
    }
}



io.on('connection', onIOConnect);

function onIOConnect(socket) {
    socket.uuid = UUID.v4();

    console.log(`Client connected:  ${socket.handshake.address}  sid:${socket.id}  uuid:${socket.uuid}`);
    
    socket.on('click', onClientClick);
    
    socket.on('retrieve', onRetrieveClicks);

    socket.on('disconnect', function onSocketDisconnect(reason) {
        console.log(`Client ${socket.id} disconnected: ${reason}`);
        delete connectedUsersObj[socket.uuid];
    });

    socket.emit('clientConnected', socket.uuid);

    connectedUsersObj[socket.uuid] = socket;
}

function onClientClick(msgObj) {
    const {clientId, x, y} = msgObj;
    if (!connectedUsersObj[clientId]) return;
    
    points.push({x, y});
    console.log(`Client ${clientId} clicked ${x},${y}.`);
    connectedUsersObj[clientId].broadcast.emit('click', {x, y});
}

function onRetrieveClicks(clientId) {
    if (!connectedUsersObj[clientId]) return;

    connectedUsersObj[clientId].emit('clicks', points);
}




// error on crash
process.on("uncaughtException", (err) => {
    console.error(`Unhandled Exception Error: ${err}`);
    process.exit(1);
});