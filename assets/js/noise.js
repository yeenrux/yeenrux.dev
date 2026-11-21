// background grain
(() => {
  const ua = navigator.userAgent;
  // safari makes things look stupid asf and idk why
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua)) {
    document.body.classList.add('plain-crt');
  }

  const box = document.getElementById('noise');
  const pen = box.getContext('2d', { alpha: false });

  let last = 0;
  let img;

  function resize() {
    box.width = Math.ceil(innerWidth / 3);
    box.height = Math.ceil(innerHeight / 3);
    img = pen.createImageData(box.width, box.height);
  }

  function frame(time) {
    requestAnimationFrame(frame);
    if (time - last < 50) return;

    last = time;

    const data = img.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.random() < .5 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = gray;
      data[i + 3] = 255;
    }

    pen.putImageData(img, 0, 0);
  }

  resize();
  addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
