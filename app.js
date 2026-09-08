'use strict';

let _ctx = null;
function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

function snd(type) {
  try {
    const c = ac();
    const m = c.createGain();
    m.gain.setValueAtTime(0.15, c.currentTime);
    m.connect(c.destination);

    if (type === 'hover') {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(180, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(55, c.currentTime + .1);
      g.gain.setValueAtTime(.25, c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .1);
      o.connect(g); g.connect(m);
      o.start(); o.stop(c.currentTime + .12);
    }

    if (type === 'click') {
      const buf = c.createBuffer(1, c.sampleRate * .18, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
      const s = c.createBufferSource(), f = c.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.8;
      s.buffer = buf; s.connect(f); f.connect(m); s.start();
    }

    if (type === 'intro') {
      [70, 110, 150].forEach((fr, i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = i === 1 ? 'square' : 'sawtooth';
        o.frequency.setValueAtTime(fr, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(fr * 2.8, c.currentTime + .7);
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(.12, c.currentTime + .1);
        g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .7);
        o.connect(g); g.connect(m);
        o.start(c.currentTime + i * .06);
        o.stop(c.currentTime + .75);
      });
    }

    if (type === 'beat') {
      [0, .14].forEach(off => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = 55;
        g.gain.setValueAtTime(0, c.currentTime + off);
        g.gain.linearRampToValueAtTime(.35, c.currentTime + off + .04);
        g.gain.exponentialRampToValueAtTime(.001, c.currentTime + off + .2);
        o.connect(g); g.connect(m);
        o.start(c.currentTime + off);
        o.stop(c.currentTime + off + .22);
      });
    }

    if (type === 'tick') {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1400, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(300, c.currentTime + .07);
      g.gain.setValueAtTime(.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .07);
      o.connect(g); g.connect(m);
      o.start(); o.stop(c.currentTime + .09);
    }

  } catch(e) {}
}

(function() {
  const cur = document.getElementById('cursor');
  const dot = document.getElementById('cursor-dot');
  let mx = -200, my = -200, tx = -200, ty = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top  = my + 'px';
  });

  (function trail() {
    tx += (mx - tx) * .12;
    ty += (my - ty) * .12;
    dot.style.left = tx + 'px';
    dot.style.top  = ty + 'px';
    requestAnimationFrame(trail);
  })();

  document.addEventListener('mousedown', () => {
    snd('click');
    cur.style.transform = 'translate(-4px,-4px) scale(1.7)';
    spawnClickBurst(mx, my);
    setTimeout(() => cur.style.transform = '', 180);
  });
})();

(function() {
  const cv = document.getElementById('bg-canvas');
  const cx = cv.getContext('2d');
  let W, H;
  const P = [];

  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
  resize(); addEventListener('resize', resize);

  class Pt {
    constructor(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 5;
      this.vx = (Math.random() - .5) * .35;
      this.vy = -(Math.random() * .45 + .15);
      this.r = Math.random() * 1.8 + .3;
      this.a = Math.random() * .35 + .04;
      this.life = 0;
      this.max  = Math.random() * 280 + 180;
      const pal = ['#ff003377','#8b000077','#33000055','#660000aa','#ff222255'];
      this.c = pal[Math.random() * pal.length | 0];
    }
    step() {
      this.x += this.vx; this.y += this.vy; this.life++;
      if (this.y < -8 || this.life > this.max) { Object.assign(this, new Pt(false)); }
    }
    draw() {
      cx.save();
      cx.globalAlpha = this.a * (1 - this.life / this.max);
      cx.fillStyle = this.c;
      cx.shadowBlur = 5; cx.shadowColor = this.c;
      cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI*2); cx.fill();
      cx.restore();
    }
  }

  for (let i = 0; i < 90; i++) P.push(new Pt(true));

  (function loop() {
    cx.clearRect(0, 0, W, H);
    P.forEach(p => { p.step(); p.draw(); });
    requestAnimationFrame(loop);
  })();
})();

function spawnClickBurst(x, y) {
  const cv = document.getElementById('bg-canvas');
  const cx = cv.getContext('2d');
  const sparks = Array.from({length:14}, (_, i) => {
    const a = (Math.PI * 2 / 14) * i;
    const sp = Math.random() * 5 + 2;
    return { x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 1, r: Math.random()*3+1 };
  });
  (function go() {
    sparks.forEach(s => {
      cx.save();
      cx.globalAlpha = s.life * .9;
      cx.fillStyle = `rgba(255,0,51,${s.life})`;
      cx.shadowBlur = 12; cx.shadowColor = '#ff0033';
      cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, Math.PI*2); cx.fill();
      cx.restore();
      s.x += s.vx; s.y += s.vy; s.vy += .18; s.life -= .055;
    });
    if (sparks.some(s => s.life > 0)) requestAnimationFrame(go);
  })();
}

(function() {
  const overlay = document.getElementById('intro');
  const site    = document.getElementById('site');
  if (!overlay || !site) return;

  function enter() {
    snd('intro');
    overlay.classList.add('fade-out');
    flashScreen(3);
    setTimeout(() => {
      overlay.style.display = 'none';
      site.classList.remove('site-hidden');
      site.classList.add('site-visible');
      startHeartbeat();
    }, 900);
  }

  overlay.addEventListener('click',     enter, { once: true });
  overlay.addEventListener('touchstart', enter, { once: true });
  document.addEventListener('keydown',  enter, { once: true });
})();

function flashScreen(times) {
  let el = document.querySelector('.screen-flash');
  if (!el) {
    el = document.createElement('div');
    el.className = 'screen-flash';
    document.body.appendChild(el);
  }
  let t = 0;
  const seq = [0, 60, 120, 200, 260, 380];
  seq.forEach((ms, i) => {
    setTimeout(() => {
      el.style.opacity = i % 2 === 0 ? '.22' : '0';
    }, ms);
  });
  setTimeout(() => el.style.opacity = '0', 420);
}

function startHeartbeat() {
  setInterval(() => {
    snd('beat');
    document.body.style.boxShadow = 'inset 0 0 90px #2a000033';
    setTimeout(() => document.body.style.boxShadow = '', 280);
  }, 3200);
}

document.addEventListener('mouseover', e => {
  if (e.target.closest('a, button, .soc-btn')) snd('hover');
});

document.addEventListener('mousemove', e => {
  const p = document.getElementById('penta-svg');
  if (!p) return;
  const dx = (e.clientX - innerWidth  / 2) / (innerWidth  / 2);
  const dy = (e.clientY - innerHeight / 2) / (innerHeight / 2);
  p.style.transform = `rotate(${dx * 8}deg) translate(${dx * 12}px, ${dy * 8}px)`;

  if (Math.random() < .002) doGlitch();
});

let glitchCd = false;
function doGlitch() {
  if (glitchCd) return;
  glitchCd = true;
  const g = document.createElement('div');
  const ang = Math.random() * 360 | 0;
  g.style.cssText = `
    position:fixed;inset:0;z-index:8000;pointer-events:none;
    background:linear-gradient(${ang}deg,
      rgba(255,0,51,.07) 0%, transparent 35%,
      rgba(0,200,255,.05) 55%, transparent 100%);
    transform:translateX(${(Math.random()-.5)*14}px) skewX(${(Math.random()-.5)*4}deg);
    mix-blend-mode:overlay;
  `;
  document.body.appendChild(g);
  snd('tick');
  setTimeout(() => { g.remove(); glitchCd = false; }, 110);
}

(function() {
  const btn   = document.getElementById('music-toggle');
  const audio = document.getElementById('bg-music');
  const icon  = document.getElementById('play-icon');
  const bars  = document.querySelectorAll('.bar');
  if (!btn || !audio) return;
  let playing = false;

  btn.addEventListener('click', () => {
    snd('click');
    if (!playing) {
      audio.play()
        .then(() => {
          playing = true;

          if (icon) icon.setAttribute('d', 'M9 8 L9 22 L13 22 L13 8 Z M17 8 L17 22 L21 22 L21 8 Z');
          bars.forEach(b => b.classList.remove('paused'));
        })
        .catch(() => {
          btn.title = 'придурок ебанный';
        });
    } else {
      audio.pause();
      playing = false;
      if (icon) icon.setAttribute('d', 'M11 8 L11 22 L23 15 Z');
      bars.forEach(b => b.classList.add('paused'));
    }
  });
})();

const runesBurst = [
  `<svg viewBox="0 0 20 20"><polygon points="10,1 4,18 18,7 2,7 16,18" fill="none" stroke="#ff0033" stroke-width="1.5"/></svg>`,
  `<svg viewBox="0 0 20 20"><rect x="9" y="1" width="2" height="18" fill="#cc0000"/><rect x="1" y="7" width="18" height="2" fill="#cc0000"/></svg>`,
  `<svg viewBox="0 0 20 20"><path d="M10 1 L13 8 L10 14 L7 8 Z" fill="#990000"/></svg>`,
];

document.querySelectorAll('.soc-btn, .social-card').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    snd('hover');
    const rect = btn.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.innerHTML = runesBurst[i % runesBurst.length];
        const dx = (Math.random() - .5) * 60;
        const dy = -(Math.random() * 50 + 20);
        el.style.cssText = `
          position:fixed;
          left:${rect.left + Math.random()*rect.width}px;
          top:${rect.top + Math.random()*rect.height}px;
          width:16px;height:16px;
          pointer-events:none;z-index:9500;
          opacity:1;
          transition:transform .5s ease,opacity .5s ease;
          filter:drop-shadow(0 0 4px #ff0033);
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transform = `translate(${dx}px,${dy}px) rotate(${Math.random()*360}deg) scale(.3)`;
          el.style.opacity = '0';
        });
        setTimeout(() => el.remove(), 520);
      }, i * 55);
    }
  });
});

document.addEventListener('dblclick', e => {
  snd('intro');
  flashScreen(2);
  const pentaSVG = `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><polygon points="15,2 6,27 27,11 3,11 24,27" fill="none" stroke="#ff0033" stroke-width="1.5"/></svg>`;

  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.innerHTML = pentaSVG;
      el.style.cssText = `
        position:fixed;left:${e.clientX}px;top:${e.clientY}px;
        width:${Math.random()*18+10}px;pointer-events:none;z-index:9999;
        filter:drop-shadow(0 0 5px #ff0033);
      `;
      document.body.appendChild(el);
      const angle = Math.random() * Math.PI * 2;
      const sp    = Math.random() * 130 + 60;
      let tx = 0, ty = 0, gy = Math.sin(angle) * sp / 60 - 3.5, alpha = 1;
      const vx = Math.cos(angle) * sp / 60;
      (function anim() {
        tx += vx; ty += gy; gy += .22; alpha -= .022;
        el.style.transform = `translate(${tx}px,${ty}px) rotate(${tx*3}deg)`;
        el.style.opacity = alpha;
        if (alpha > 0) requestAnimationFrame(anim); else el.remove();
      })();
    }, i * 28);
  }
});


setInterval(() => {
  const logo = document.querySelector('.site-logo');
  if (!logo) return;
  logo.style.transition = 'opacity .04s';
  logo.style.opacity = '.08';
  setTimeout(() => logo.style.opacity = '1', 45);
  setTimeout(() => { logo.style.opacity = '.04'; setTimeout(() => logo.style.opacity = '1', 35); }, 95);
}, 3000 + Math.random() * 2000);

