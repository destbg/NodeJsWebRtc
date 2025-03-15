import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import wrtc from 'wrtc';
import SimplePeer from 'simple-peer';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// If you need __dirname in ESM:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

// Set your preferred security configuration for helmet
// (you may need to adjust CSP or other settings depending on your front-end)
app.use(helmet());

// Serve static files from the "client" folder
app.use(express.static(path.join(__dirname, 'client')));

// Keep track of “streams”
let streams = [];

// When a client connects to Socket.IO:
io.on('connection', (sock) => {
    console.log(sock.id + ' connected');

    const id = sock.id;
    const peer = new SimplePeer({
        trickle: false,
        wrtc: wrtc,
        initiator: true
    });

    // When SimplePeer has local signaling data to send:
    peer.on('signal', (data) => {
        console.log(id + ' sending signal');
        sock.emit('send-signal', JSON.stringify(data));
    });

    // When we receive signaling data from the client:
    sock.on('signal', (data) => {
        console.log(id + ' received signal');
        peer.signal(data);
    });

    // Handle disconnect
    sock.on('disconnect', () => {
        console.log(id + ' disconnected');
        streams = streams.filter((f) => f.id !== id);
        peer.end();
    });

    // Mark this socket as a streamer
    sock.on('is-stream', () => {
        streams.push({ id, peer });
    });

    // Join an existing stream
    sock.on('join-stream', (streamId) => {
        const streamReceiver = streams.find((f) => f.id === streamId);
        if (streamReceiver) {
            // Take the tracks from the streaming peer and add them locally
            const senderTracks = streamReceiver.peer._pc
                .getReceivers()
                .map((receiver) => receiver.track);

            // Create a new MediaStream from the sender’s tracks
            const newMediaStream = new wrtc.MediaStream(senderTracks);

            // Add that MediaStream to our peer
            peer.addStream(newMediaStream);
        }
    });
});

// Provide a list of current active stream IDs
app.get('/streams', (_, res) => {
    res.json({ streams: streams.map((f) => f.id) });
});

// Serve up any additional pages
app.get('/stream', (_, res) => {
    res.sendFile(path.join(__dirname, 'client', 'stream.html'));
});

app.get('/streaming', (_, res) => {
    res.sendFile(path.join(__dirname, 'client', 'streaming.html'));
});

// Catch-all route to serve your front-end
app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Port configuration
const PORT = process.env.PORT || 4200;
httpServer.listen(PORT, () => {
    console.log('Server started on port ' + PORT);
});
