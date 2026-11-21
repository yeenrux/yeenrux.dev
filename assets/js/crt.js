(() => {
  const box = document.getElementById('crt');
  const pen = box.getContext('2d');
  const home = document.getElementById('home');

  // this will be helpful later for back buttons and shit
  if (location.hash === '#skip') {
    document.body.classList.add('tv');
    dispatchEvent(new Event('home-ready'));

    box.hidden = true;

    home.hidden = false;
    move();
    return;
  }

  const lines = ['this site is very wip', '', 'loading...'];

  function draw() {
    const w = Math.min(window.innerWidth, 680);
    box.width = Math.max(1, Math.ceil(w / 1.6));
    const size = Math.max(10, Math.min(16, box.width / 70));
    const h = size * 1.35;

    box.height = Math.ceil(lines.length * h + 16);
    pen.clearRect(0, 0, box.width, box.height);
    pen.font = `${size}px monospace`;

    pen.textBaseline = 'top';

    let y = 5;
    for (const line of lines) {
      pen.fillStyle = 'rgba(255,55,75,.30)';
      pen.fillText(line, 7.6, y);

      pen.fillStyle = 'rgba(55,245,150,.25)';
      pen.fillText(line, 8.4, y);

      pen.fillStyle = '#d6d4d6';
      pen.fillText(line, 8, y);

      y += h;
    }
  }

  function status(line) {
    lines.push(line);
    box.setAttribute('aria-label', lines.filter(Boolean).join('. '));
    draw();
  }

  draw();
  addEventListener('resize', draw);
  const enter = document.getElementById('enter');

  async function load() {
    const files = document.querySelectorAll('link[rel="stylesheet"], script[src]');
    const src = document.querySelector('feImage').getAttribute('href');

    const page = new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else addEventListener('load', resolve, { once: true });
    });

    const map = new Image();
    const warp = new Promise(resolve => {
      map.onload = () => {
        status(`loaded ${src.split('/').pop()}`);
        resolve();
      };

      map.src = src;
    });

    await Promise.all([
      page.then(() => {
        for (const file of files) {
          const url = file.href || file.src;
          status(`loaded ${url.split('/').pop()}`);
        }
      }),
      warp,
      document.fonts.ready.then(() => {
        const font = getComputedStyle(document.body).fontFamily;
        status(`loaded ${font}`);
      })
    ]);

    status('ready.');
    enter.hidden = false;
  }

  async function open() {
    enter.hidden = true;
    status('transitioning to home...');
    window.start_sound?.().then(() => dispatchEvent(new Event('site-ready')));

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.body.classList.add('tv');
    dispatchEvent(new Event('home-ready'));

    if (!still) {
      await box.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 400,
        easing: 'ease-out',
        fill: 'forwards'
      }).finished;
    }

    box.hidden = true;

    await new Promise(resolve => setTimeout(resolve, 750));

    home.hidden = false;
    home.inert = true;

    if (!still) {
      const channel = document.getElementById('channel');
      const fade = [{ opacity: 0 }, { opacity: 1 }];
      const opts = {
        duration: 400,
        easing: 'ease-in'
      };
      channel.animate(fade, opts);
      await home.animate(fade, opts).finished;
    }

    home.inert = false;
    move();
  }

  function move() {
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const screen = document.getElementById('screen');
    let x = 0;
    let y = 0;
    const angle = (30 + Math.random() * 30) * Math.PI / 180;
    let dx = Math.cos(angle) * (Math.random() < .5 ? -65 : 65);
    let dy = Math.sin(angle) * (Math.random() < .5 ? -65 : 65);
    let last = 0;

    function frame(time) {
      const dt = Math.min((time - (last || time)) / 1000, .05);
      last = time;
      requestAnimationFrame(frame);

      if (still.matches) {
        home.style.transform = '';
        return;
      }

      const rect = screen.getBoundingClientRect();
      const w = Math.max(0, (innerWidth * screen.clientWidth / rect.width - home.offsetWidth) / 2);
      const h = Math.max(0, (innerHeight * screen.clientHeight / rect.height - home.offsetHeight) / 2);
      x += dx * dt;
      y += dy * dt;

      const side = x < -w ? 1 : x > w ? -1 : 0;
      const edge = y < -h ? 1 : y > h ? -1 : 0;
      x = Math.max(-w, Math.min(w, x));
      y = Math.max(-h, Math.min(h, y));
      if (w && side) dx = Math.abs(dx) * side;
      if (h && edge) dy = Math.abs(dy) * edge;

      home.style.transform = `translate(${x}px, ${y}px)`;
    }

    requestAnimationFrame(frame);
  }

  enter.addEventListener('click', open, { once: true });
  load();
})();
