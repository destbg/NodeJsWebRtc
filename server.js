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

const streams = [];

io.on("connection", (sock) => {
  const id = sock.id;
  const peer = new SimplePeer({ trickle: false, wrtc: wrtc });

  peer.on("signal", (data) => {
    sock.emit("send-signal", JSON.stringify(data));
  });

  sock.on("disconnect", () => {
    const index = streams.findIndex((f) => f.id == id);
    if (index != -1) {
      streams.splice(index, 1);
    }
    peer.end();
  });

  sock.on("is-stream", () => {
    streams.push({
      id: id,
      peer: peer,
    });
  });

  sock.on("signal", (data) => {
    peer.signal(data);
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

app.get("/*", (_, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

http.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
