const backButton = document.getElementById("back");
const playStream = document.getElementById("play-stream");
const socket = io();
const peer = new SimplePeer({ trickle: false });

peer.on("signal", (data) => {
  console.log("sending signal");
  socket.emit("signal", JSON.stringify(data));
});

socket.on("send-signal", (data) => {
  console.log("receiving signal");
  peer.signal(data);
});

peer.on("connect", () => {
  document.getElementById("loading").style.display = "none";
});

peer.on("stream", (stream) => {
  if ("srcObject" in playStream) {
    playStream.srcObject = stream;
  } else {
    playStream.src = window.URL.createObjectURL(stream); // for older browsers
  }
  playStream.play();
});

socket.emit(
  "join-stream",
  new URLSearchParams(window.location.search).get("id")
);

backButton.addEventListener("click", () => {
  window.location.href = "/";
});
