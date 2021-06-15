const backButton = document.getElementById("back");
const playStream = document.getElementById("play-stream");
const socket = io({
  is_stream: false,
});
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
  socket.emit(
    "join-stream",
    new URLSearchParams(window.location.search).get("id")
  );
});

peer.on("stream", (stream) => {
  if ("srcObject" in playStream) {
    playStream.srcObject = stream;
  } else {
    playStream.src = window.URL.createObjectURL(stream);
  }
  playStream.play();
});

backButton.addEventListener("click", () => {
  window.location.href = "/";
});
