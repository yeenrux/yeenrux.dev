(() => {
  let audio;
  let noise;
  let vol;
  let tick;
  let played = false;
  let level = .0004;

  function fade(next, sec = .8) {
    level = next;
    if (!vol) return;

    const now = audio.currentTime;
    vol.gain.cancelScheduledValues(now);
    vol.gain.setValueAtTime(vol.gain.value, now);
    vol.gain.linearRampToValueAtTime(next, now + sec);
  }

  function click() {
    if (played || audio?.state !== 'running') return;

    const pulse = audio.createBufferSource();
    const gain = audio.createGain();
    pulse.buffer = tick;
    gain.gain.setValueAtTime(.08, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .035);

    pulse.connect(gain).connect(audio.destination);
    pulse.start();
    pulse.stop(audio.currentTime + .04);

    pulse.onended = () => {
      pulse.disconnect();
      gain.disconnect();
    };

    played = true;
  }

  async function start(e) {
    if (e?.type === 'keydown' && e.repeat) return;

    if (!audio) {
      audio = new AudioContext();

      const buf = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      noise = audio.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;

      vol = audio.createGain();
      vol.gain.value = level;
      noise.connect(vol).connect(audio.destination);
      noise.start();

      tick = audio.createBuffer(1, Math.ceil(audio.sampleRate * .04), audio.sampleRate);
      tick.copyToChannel(data.subarray(0, tick.length), 0);
    }

    await audio.resume();
  }

  window.start_sound = start;
  if (!document.getElementById('enter')) start();
  addEventListener('pointerdown', start);
  addEventListener('keydown', start);

  addEventListener('site-ready', click);
  addEventListener('home-ready', () => fade(.0015));

  document.addEventListener('visibilitychange', () => {
    if (vol) vol.gain.setTargetAtTime(!document.hidden ? level : 0, audio.currentTime, .08);
  });

  document.addEventListener('click', async e => {
    const link = e.target.closest('a[href]');
    if (!link || link.origin !== location.origin || e.metaKey || e.ctrlKey) return;

    e.preventDefault();

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      location.href = link.href;
      return;
    }

    fade(.0004, .6);
    const main = document.querySelector('.content');

    const out = main.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 600,
      easing: 'ease-in',
      fill: 'forwards'
    });
    await out.finished;

    addEventListener('pageshow', () => {
      out.cancel();
      fade(.0004);
    }, { once: true });
    location.href = link.href;
  });
})();
