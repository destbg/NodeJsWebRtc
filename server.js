const express = require('express');
const path = require('path');
const helmet = require('helmet');
const wrtc = require('wrtc');
const SimplePeer = require('simple-peer');

const app = express();
const http = require('http').createServer(app);
const PORT = process.env.PORT || 4200;
const peer = new SimplePeer({ trickle: false, initiator: true, wrtc: wrtc });
let clientPeer; 

let clientPeerData;
let peerData;

peer.on('signal', (data) => {
  peerData = JSON.stringify(data);
  console.log('mobile: ' + peerData);
});

peer.on('stream', (stream) => {
  clientPeer = new SimplePeer({ trickle: false, initiator: true, wrtc: wrtc, stream: stream });

  clientPeer.on('signal', (data) => {
    clientPeerData = JSON.stringify(data);
    console.log('client: ' + clientPeerData);
  });

  clientPeer.on('data', (data) => {
    clientPeer.send(data);
  });
});

app.use(helmet());
app.use(express.static(path.join(__dirname, 'client')));

app.post('/connectclientsignal', (req, res) => {
  console.log(req.query.data);
  clientPeer.signal(req.query.data);
  res.send();
});

app.post('/connectclient', (_, res) => {
  res.send(clientPeerData);
});

app.post('/connect', (_, res) => {
  res.send(peerData);
});

app.post('/connectsignal', (req, res) => {
  console.log(req.query.data);
  peer.signal(req.query.data);
  res.send();
});

app.get('/*', (_, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

http.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});
