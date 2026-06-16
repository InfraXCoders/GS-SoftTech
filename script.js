// GS SoftTech — Interactive JS

document.addEventListener('DOMContentLoaded', function () {

  // ── Scroll progress bar ──
  var bar = document.getElementById('scroll-progress');
  if (bar) {
    window.addEventListener('scroll', function () {
      var s = document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (s / h * 100) + '%';
    }, { passive: true });
  }

  // ── Mobile nav ──
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () { links.classList.toggle('open'); });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // ── Active nav link ──
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  // ── Footer year ──
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();

  // ── Hero canvas particles ──
  var canvas = document.getElementById('hero-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var mouse = { x: null, y: null };

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    canvas.parentElement.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () {
      mouse.x = null; mouse.y = null;
    });

    function Particle() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.8 + 0.4;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.6 ? '0,229,255' : '41,121,255';
    }
    Particle.prototype.update = function () {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

      if (mouse.x !== null) {
        var dx = mouse.x - this.x, dy = mouse.y - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.x -= dx * 0.02;
          this.y -= dy * 0.02;
        }
      }
    };
    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + this.color + ',' + this.opacity + ')';
      ctx.fill();
    };

    for (var i = 0; i < 80; i++) particles.push(new Particle());

    function connectParticles() {
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var dx = particles[a].x - particles[b].x;
          var dy = particles[a].y - particles[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(41,121,255,' + (0.12 * (1 - dist / 100)) + ')';
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animateCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) { p.update(); p.draw(); });
      connectParticles();
      requestAnimationFrame(animateCanvas);
    }
    animateCanvas();
  }

  // ── Typing animation ──
  var taglineEl = document.getElementById('tagline-text');
  if (taglineEl) {
    var phrases = ['Secure. Scalable. Intelligent.', 'Built for the cloud.', 'AI-powered solutions.', 'Zero-trust security.', 'Real-time observability.'];
    var pIdx = 0, cIdx = 0, deleting = false;
    function type() {
      var current = phrases[pIdx];
      if (!deleting) {
        taglineEl.textContent = current.slice(0, ++cIdx);
        if (cIdx === current.length) { deleting = true; setTimeout(type, 2200); return; }
        setTimeout(type, 60);
      } else {
        taglineEl.textContent = current.slice(0, --cIdx);
        if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; setTimeout(type, 400); return; }
        setTimeout(type, 30);
      }
    }
    setTimeout(type, 600);
  }

  // ── Counter animation ──
  function animateCount(el) {
    var target = parseFloat(el.dataset.target);
    var suffix = el.dataset.suffix || '';
    var duration = 1800;
    var start = performance.now();
    function update(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ── Scroll reveal + counters ──
  var revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  var counters = document.querySelectorAll('.count');
  var countersDone = false;

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });

    // Counters trigger when hero stats are visible
    var statsEl = document.querySelector('.hero-stats');
    if (statsEl && counters.length) {
      var cio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !countersDone) {
          countersDone = true;
          counters.forEach(animateCount);
          cio.disconnect();
        }
      }, { threshold: 0.5 });
      cio.observe(statsEl);
    }
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    counters.forEach(animateCount);
  }

  // ── Card spotlight (mouse-follow glow) ──
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
    });
  });

  // ── Hero card 3D tilt ──
  var heroCard = document.querySelector('.hero-card');
  if (heroCard) {
    heroCard.addEventListener('mousemove', function (e) {
      var rect = heroCard.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      heroCard.style.transform = 'perspective(900px) rotateX(' + (-y * 10) + 'deg) rotateY(' + (x * 10) + 'deg) translateY(-6px)';
    });
    heroCard.addEventListener('mouseleave', function () {
      heroCard.style.transform = '';
    });
  }

  // ── Contact form ──
  var form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = document.querySelector('.form-success');
      if (ok) { ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      form.reset();
    });
  }
});
