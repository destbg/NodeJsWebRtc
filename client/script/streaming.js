const myStream = document.getElementById("my-stream");
const socket = io({
  reconnection: true,
});
const peer = new SimplePeer({ trickle: false });

socket.on("send-signal", (data) => {
  console.log("receiving signal");
  peer.signal(data);
});

peer.on("signal", (data) => {
  console.log("sending signal");
  socket.emit("signal", JSON.stringify(data));
});

peer.on("connect", async () => {
  document.getElementById("loading").style.display = "none";
  await startStream();
});

async function startStream() {
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
    myStream.src = window.URL.createObjectURL(stream);
  }
  myStream.play();

  peer.addStream(stream);
}
