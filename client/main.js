(async () => {
  const startStream = document.getElementById("start-stream");
  const myStream = document.getElementById("my-stream");
  const playStream = document.getElementById("play-stream");
  const otherStreams = document.getElementById("other-streams");
  const reloadStreams = document.getElementById("reload-streams");
  const socket = io();
  const peer = new SimplePeer({ trickle: false, initiator: true });

  peer.on("signal", (data) => {
    console.log("sending signal");
    socket.emit("signal", JSON.stringify(data));
  });

  socket.on("send-signal", (data) => {
    console.log("receiving signal");
    peer.signal(data);
    document.getElementById("loading").style.display = "none";
  });

  startStream.addEventListener("click", async () => {
    socket.emit("is-stream");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { min: 10, ideal: 24, max: 60 },
        facingMode: "environment",
      },
    });

    if ("srcObject" in myStream) {
      myStream.srcObject = stream;
    } else {
      myStream.src = window.URL.createObjectURL(stream); // for older browsers
    }
    myStream.play();

    peer.addStream(stream);
  });

  peer.on("stream", (stream) => {
    if ("srcObject" in playStream) {
      playStream.srcObject = stream;
    } else {
      playStream.src = window.URL.createObjectURL(stream); // for older browsers
    }
    playStream.play();
  });

  reloadStreams.addEventListener("click", () => getStreams());

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
