(async () => {
  const input = document.querySelector('input');
  const video = document.querySelector('video');
  const button = document.getElementById('open-stream');
  const buttonSend = document.getElementById('send-text');
  const peer = new SimplePeer({ trickle: false });

  peer.on('data', (data) => {
    console.log(data);
  });

  buttonSend.addEventListener('click', () => {
    peer.send(input.value);
    input.value = '';
  })

  peer.on('signal', (data) => {
    data = JSON.stringify(data);
    console.log(data);
    fetch('/connectclientsignal?data=' + encodeURI(data), {
      method: 'POST'
    });
  });

  button.addEventListener('click', async () => {
    const res = await fetch('/connectclient', {
      method: 'POST',
    }).then((data) => data.text());
    console.log(res);
    peer.signal(res);
  });

  peer.on('stream', stream => {
    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      video.src = window.URL.createObjectURL(stream); // for older browsers
    }

    video.play();
  });
})();