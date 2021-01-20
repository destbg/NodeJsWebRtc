(async () => {
  const startStream = document.getElementById("start-stream");
  const myStream = document.getElementById("my-stream");
  const playStream = document.getElementById("play-stream");
  const otherStreams = document.getElementById("other-streams");
  const socket = io();
  const peer = new SimplePeer({ trickle: false, initiator: true });

  peer.on("signal", (data) => {
    socket.emit("signal", JSON.stringify(data));
  });

  socket.on("send-signal", (data) => {
    peer.signal(data);
  });

  startStream.addEventListener("click", async () => {
    socket.emit("is-stream");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    if ("srcObject" in myStream) {
      myStream.srcObject = stream;
    } else {
      myStream.src = window.URL.createObjectURL(stream); // for older browsers
    }
    myStream.play();
  });

  peer.on("stream", (stream) => {
    if ("srcObject" in playStream) {
      playStream.srcObject = stream;
    } else {
      playStream.src = window.URL.createObjectURL(stream); // for older browsers
    }
    playStream.play();
  });

  getStreams();

  async function getStreams() {
    otherStreams.innerHTML = "";
    const streamsResult = await fetch("/streams").then((data) => data.json());

    for (const stream of streamsResult.streams) {
      const button = document.createElement("button");
      button.innerHTML = stream;
      button.addEventListener("click", () => {
        joinStream(stream);
      });

      otherStreams.appendChild(button);
    }
  }

  function joinStream(stream) {
    socket.emit("join-stream", stream);
  }
})();
