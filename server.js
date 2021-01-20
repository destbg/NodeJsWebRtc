const express = require("express");
const path = require("path");
const helmet = require("helmet");
const wrtc = require("wrtc");
const SimplePeer = require("simple-peer");

const app = express();
const http = require("http").createServer(app);
const PORT = process.env.PORT || 4200;
const peer = new SimplePeer({ trickle: false, initiator: true, wrtc: wrtc });
const clientPeer = new SimplePeer({
  trickle: false,
  initiator: true,
  wrtc: wrtc,
});

const audioTrack = peer._pc.addTransceiver("audio").receiver.track;
const videoTrack = peer._pc.addTransceiver("video").receiver.track;
const audioTransceiver = clientPeer._pc.addTransceiver("audio");
const videoTransceiver = clientPeer._pc.addTransceiver("video");
audioTransceiver.sender.replaceTrack(audioTrack);
videoTransceiver.sender.replaceTrack(videoTrack);

let clientPeerData;
let peerData;

peer.on("signal", (data) => {
  peerData = JSON.stringify(data);
  console.log("mobile: " + peerData);
});

peer.on("stream", () => {
  console.log("received stream");
  // Transferring stream from one rtc to another
  //clientPeer.addStream(stream);
});

peer.on("data", (data) => {
  peer.send(data);
});

clientPeer.on("signal", (data) => {
  clientPeerData = JSON.stringify(data);
  console.log("client: " + clientPeerData);
});

clientPeer.on("data", (data) => {
  clientPeer.send(data);
});

app.use(helmet());
app.use(express.static(path.join(__dirname, "client")));

app.get("/connectclientsignal", (req, res) => {
  console.log(req.query.data);
  clientPeer.signal(req.query.data);
  res.send();
});

app.get("/connectclient", (_, res) => {
  res.send(clientPeerData);
});

app.get("/connectsignal", (req, res) => {
  console.log(req.query.data);
  peer.signal(req.query.data);
  res.send();
});

app.get("/connect", (_, res) => {
  res.send(peerData);
});

app.get("/*", (_, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

http.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
