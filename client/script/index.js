const otherStreams = document.getElementById("other-streams");
const reloadStreams = document.getElementById("reload-streams");

reloadStreams.addEventListener("click", () => getStreams());

getStreams();

async function getStreams() {
  otherStreams.innerHTML = "";
  const streamsResult = await fetch("/streams").then((data) => data.json());

  for (const stream of streamsResult.streams) {
    const button = document.createElement("div");
    button.classList.add("stream-link");
    button.innerHTML = stream;
    button.addEventListener("click", () => {
      joinStream(stream);
    });

    otherStreams.appendChild(button);
  }
}

function joinStream(stream) {
  window.location.href = "/stream?id=" + stream;
}
