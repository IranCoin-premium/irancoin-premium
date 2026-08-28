(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Language / direction ---------------- */
  const langBtns = document.querySelectorAll('.lang-btn');
  function setLang(lang){
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.setLang === lang));
    try { localStorage.setItem('ic_lang', lang); } catch(e){}
  }
  langBtns.forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.setLang)));
  let savedLang = null;
  try { savedLang = localStorage.getItem('ic_lang'); } catch(e){}
  if (savedLang === 'en' || savedLang === 'fa') setLang(savedLang);

  /* ---------------- Scroll reveals ---------------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (reduceMotion) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------------- Market tabs ---------------- */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`);
      if (target) target.classList.add('active');
    });
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    function sync(open){
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
      item.classList.toggle('open', open);
    }
    sync(item.classList.contains('open'));
    q.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => { if (other !== item) sync.call(other, false); });
      // close others properly
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = '0px';
        }
      });
      sync(willOpen);
    });
    window.addEventListener('resize', () => { if (item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px'; });
  });

  /* ---------------- Pricing calculator ---------------- */
  const durBtns = document.querySelectorAll('.dur-btn');
  const priceValue = document.getElementById('priceValue');
  const pricePer = document.getElementById('pricePer');
  const priceMath = document.getElementById('priceMath');
  const BASE_DAILY = 29 / 7; // reference rate from the 7-day plan

  const perLabels = {
    7:   { fa: 'برای ۷ روز', en: 'for 7 days' },
    30:  { fa: 'برای ۱ ماه', en: 'for 1 month' },
    90:  { fa: 'برای ۳ ماه', en: 'for 3 months' },
    180: { fa: 'برای ۶ ماه', en: 'for 6 months' },
    365: { fa: 'برای ۱ سال', en: 'for 1 year' }
  };

  function updatePricing(btn){
    const days = Number(btn.dataset.days);
    const price = Number(btn.dataset.price);
    priceValue.textContent = price;

    const label = perLabels[days] || perLabels[7];
    pricePer.innerHTML =
      `<span data-fa-only>${label.fa}</span><span data-en-only>${label.en}</span>`;

    const referencePrice = BASE_DAILY * days;
    const savingsPct = Math.max(0, Math.round((1 - price / referencePrice) * 100));
    if (savingsPct > 0) {
      priceMath.style.display = 'block';
      priceMath.innerHTML =
        `<span data-fa-only>≈ ${savingsPct}% کمتر از نرخ روزانهٔ پایه (${referencePrice.toFixed(0)}$)</span>` +
        `<span data-en-only>≈ ${savingsPct}% below the base daily rate ($${referencePrice.toFixed(0)})</span>`;
    } else {
      priceMath.style.display = 'none';
    }
  }

  durBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      durBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePricing(btn);
    });
  });

  /* ---------------- Hero canvas: layered rotating core ---------------- */
  function setupHeroCanvas(){
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const cx = () => w / 2, cy = () => h / 2;
    const rings = [
      { r: 0.30, speed: 0.30, dash: [2, 10], width: 1, color: 'rgba(201,169,97,0.55)' },
      { r: 0.40, speed: -0.18, dash: [1, 6], width: 1, color: 'rgba(79,209,232,0.35)' },
      { r: 0.48, speed: 0.11, dash: [6, 4], width: 1, color: 'rgba(243,241,234,0.14)' }
    ];
    const nodes = Array.from({ length: 14 }, (_, i) => ({
      angle: (i / 14) * Math.PI * 2,
      radius: 0.30 + (i % 3) * 0.055,
      speed: 0.14 + (i % 4) * 0.05,
      size: 1.4 + (i % 3) * 0.9
    }));

    let t = 0;
    function draw(){
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h);

      // core glow
      const grad = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), R * 0.22);
      grad.addColorStop(0, 'rgba(201,169,97,0.35)');
      grad.addColorStop(1, 'rgba(201,169,97,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx(), cy(), R * 0.22, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = 'rgba(201,169,97,0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx(), cy(), R * 0.09, 0, Math.PI * 2); ctx.stroke();

      rings.forEach(ring => {
        ctx.save();
        ctx.setLineDash(ring.dash);
        ctx.lineDashOffset = -t * ring.speed * 40;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width;
        ctx.beginPath(); ctx.arc(cx(), cy(), R * ring.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      });

      nodes.forEach(n => {
        const angle = n.angle + t * n.speed;
        const x = cx() + Math.cos(angle) * R * n.radius;
        const y = cy() + Math.sin(angle) * R * n.radius * 0.94;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(243,241,234,0.85)';
        ctx.arc(x, y, n.size, 0, Math.PI * 2);
        ctx.fill();
      });

      t += 0.012;
      if (!reduceMotion) requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------- Orbital agents canvas ---------------- */
  function setupOrbitalCanvas(){
    const canvas = document.getElementById('orbitalCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const cx = () => w / 2, cy = () => h / 2;
    const agents = [
      { color: '#c9a961', radius: 0.30, speed: 0.42, phase: 0 },
      { color: '#4fd1e8', radius: 0.30, speed: 0.42, phase: (Math.PI * 2) / 3 },
      { color: '#3ecf8e', radius: 0.30, speed: 0.42, phase: (Math.PI * 4) / 3 }
    ];

    let t = 0;
    function draw(){
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h);

      ctx.strokeStyle = 'rgba(243,241,234,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx(), cy(), R * 0.30, 0, Math.PI * 2); ctx.stroke();

      // center orchestration core
      const grad = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), R * 0.13);
      grad.addColorStop(0, 'rgba(243,241,234,0.22)');
      grad.addColorStop(1, 'rgba(243,241,234,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx(), cy(), R * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(243,241,234,0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx(), cy(), R * 0.055, 0, Math.PI * 2); ctx.stroke();

      const points = agents.map(a => {
        const angle = a.phase + t * a.speed;
        return {
          x: cx() + Math.cos(angle) * R * a.radius,
          y: cy() + Math.sin(angle) * R * a.radius,
          color: a.color
        };
      });

      // connective lines to core (orchestration)
      points.forEach(p => {
        ctx.strokeStyle = p.color.replace(')', ',0.25)').replace('rgb', 'rgba').startsWith('rgba') ? p.color : p.color;
        ctx.strokeStyle = hexToRgba(p.color, 0.28);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx(), cy()); ctx.lineTo(p.x, p.y); ctx.stroke();
      });

      // agent nodes with glow
      points.forEach(p => {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 0.05);
        g.addColorStop(0, hexToRgba(p.color, 0.5));
        g.addColorStop(1, hexToRgba(p.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.05, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2); ctx.fill();
      });

      t += 0.01;
      if (!reduceMotion) requestAnimationFrame(draw);
    }
    draw();

    function hexToRgba(hex, alpha){
      const v = hex.replace('#', '');
      const bigint = parseInt(v, 16);
      const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }

  setupHeroCanvas();
  setupOrbitalCanvas();

  /* ---------------- Mobile menu (simple scroll-to, nav hidden on mobile by CSS) ---------------- */
  const menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const nav = document.querySelector('.nav-desktop');
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      nav.style.position = 'fixed';
      nav.style.top = '68px';
      nav.style.insetInline = '0';
      nav.style.background = 'var(--bg)';
      nav.style.flexDirection = 'column';
      nav.style.padding = '20px 24px';
      nav.style.borderBottom = '1px solid var(--border-soft)';
      nav.style.gap = '18px';
    });
  }
})();
