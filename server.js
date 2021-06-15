const express = require("express");
const path = require("path");
const helmet = require("helmet");
const wrtc = require("wrtc");
const SimplePeer = require("simple-peer");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 4200;

app.use(helmet());
app.use(express.static(path.join(__dirname, "client")));

let streams = [];

io.on("connection", (sock) => {
  console.log(sock.id + " connected");
  const id = sock.id;
  const is_stream = sock.handshake.query.is_stream;
  const peer = new SimplePeer({
    trickle: false,
    wrtc: wrtc,
    initiator: !is_stream,
  });

  peer.on("signal", (data) => {
    console.log(id + " sending signal");
    sock.emit("send-signal", JSON.stringify(data));
  });

  sock.on("signal", (data) => {
    console.log(id + " received signal");
    peer.signal(data);
  });

  sock.on("disconnect", () => {
    console.log(id + " disconnected");
    streams = streams.filter((f) => f.id != id);
    peer.end();
  });

  sock.on("is-stream", () => {
    streams.push({
      id: id,
      peer: peer,
    });
  });

  sock.on("join-stream", (stream) => {
    const streamReceiver = streams.find((f) => f.id == stream);
    if (streamReceiver) {
      peer.addStream(
        new wrtc.MediaStream(
          streamReceiver.peer._pc
            .getReceivers()
            .map((receiver) => receiver.track)
        )
      );
    }
  });
});

app.get("/streams", (_, res) => {
  res.json({ streams: streams.map((f) => f.id) });
});

app.get("/stream", (_, res) => {
  res.sendFile(path.join(__dirname, "client", "stream.html"));
});

app.get("/streaming", (_, res) => {
  res.sendFile(path.join(__dirname, "client", "streaming.html"));
});

app.get("/*", (_, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

http.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
