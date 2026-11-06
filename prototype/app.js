(function(){
  "use strict";

  /* ---------- Header 滚动状态 ---------- */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* ---------- 桌面下拉 ---------- */
  document.querySelectorAll('[data-dropdown]').forEach(item => {
    const btn = item.querySelector('.nav-link');
    if (!btn) return;
    const open = () => { item.classList.add('open'); btn.setAttribute('aria-expanded','true'); };
    const close = () => { item.classList.remove('open'); btn.setAttribute('aria-expanded','false'); };
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);
    btn.addEventListener('click', e => {
      e.preventDefault();
      item.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', e => { if(!item.contains(e.target)) close(); });
  });

  /* ---------- 移动端菜单 ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('.m-toggle').forEach(t => {
      if (t.tagName === 'BUTTON') {
        t.addEventListener('click', () => {
          const group = t.parentElement;
          const isOpen = group.classList.toggle('open');
          t.setAttribute('aria-expanded', String(isOpen));
        });
      } else {
        t.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
          burger.classList.remove('active');
          document.body.style.overflow = '';
        });
      }
    });
  }

  /* ---------- AI 打字机 ---------- */
  const aiText = document.getElementById('aiText');
  if (aiText) {
    const caret = document.createElement('span');
    caret.className = 'ai-caret';
    const lines = [
      "帮我看看，620 分能冲哪些 985？",
      "考研择校，如何平衡院校和专业？",
      "我的数学薄弱，该怎么规划复习？",
      "帮我生成一份高三全年提分计划。"
    ];
    let li = 0, ci = 0, deleting = false;
    function render(text){ aiText.textContent = text; aiText.appendChild(caret); }
    function tick(){
      const line = lines[li];
      if (!deleting) {
        ci++;
        if (ci > line.length) { deleting = true; render(line); setTimeout(tick, 1600); return; }
      } else {
        ci--;
        if (ci < 0) { deleting = false; ci = 0; li = (li + 1) % lines.length; render(''); setTimeout(tick, 400); return; }
      }
      render(line.slice(0, ci));
      setTimeout(tick, deleting ? 28 : 70);
    }
    render('');
    setTimeout(tick, 900);
  }

  /* ---------- 滚动 reveal ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, {threshold:.15});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- 逐字引言 ---------- */
  const quote = document.getElementById('quote');
  if (quote) {
    const text = quote.textContent.trim();
    quote.textContent = '';
    const nodes = [];
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = ch;
      if (ch === ' ') span.style.width = '0.4em';
      quote.appendChild(span);
      nodes.push(span);
    }
    const qio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          nodes.forEach((n,i) => setTimeout(() => n.classList.add('in'), i*18));
          qio.unobserve(quote);
        }
      });
    }, {threshold:.3});
    qio.observe(quote);
  }

  /* ---------- 数字滚动 ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const target = +el.dataset.count;
        const suffix = el.dataset.suffix || '';
        const dur = 1400, start = performance.now();
        function step(now){
          const p = Math.min((now-start)/dur,1);
          const eased = 1 - Math.pow(1-p,3);
          el.textContent = Math.round(target*eased) + suffix;
          if (p<1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, {threshold:.5});
    cio.observe(el);
  });

  /* ---------- 权益卡错峰 ---------- */
  const bgrid = document.querySelector('.benefit-grid');
  if (bgrid) {
    const bio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          bgrid.querySelectorAll('.bcard').forEach((c,i) => setTimeout(() => c.classList.add('in'), i*120));
          bio.unobserve(bgrid);
        }
      });
    }, {threshold:.2});
    bio.observe(bgrid);
  }

  /* ================= 工具页：志愿匹配 ================= */
  const form = document.getElementById('matchForm');
  if (form && window.SCHOOLS) {
    const resultSection = document.getElementById('resultSection');
    const resultSummary = document.getElementById('resultSummary');
    const resultBody = document.getElementById('resultBody');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const score = +form.score.value;
      const subject = form.subject.value; // 理 / 文
      if (!score || score < 100 || score > 750) {
        alert('请输入有效的分数（100-750）');
        return;
      }

      const list = window.SCHOOLS
        .map(s => ({...s, line: s.score[subject] || 0}))
        .filter(s => s.line > 0)
        .map(s => ({...s, diff: score - s.line}));

      const chong = list.filter(s => s.diff >= -10 && s.diff < 15).sort((a,b)=>b.line-a.line);
      const wen   = list.filter(s => s.diff >= 15 && s.diff < 40).sort((a,b)=>b.line-a.line);
      const bao   = list.filter(s => s.diff >= 40).sort((a,b)=>b.line-a.line);

      resultSummary.innerHTML = `按 <strong>${subject}科 ${score} 分</strong> 为你匹配到：冲刺 ${chong.length} 所 · 稳妥 ${wen.length} 所 · 保底 ${bao.length} 所。结果为示例数据，仅供参考。`;

      const group = (title, cls, arr) => {
        if (!arr.length) return '';
        return `<div class="result-group">
          <h3><span class="pill ${cls}">${title}</span> ${arr.length} 所</h3>
          <div class="school-list">
            ${arr.map(s => `<div class="school-card">
              <h4>${s.name}<span class="match">${s.tier}</span></h4>
              <div class="meta">
                <span>${s.prov}</span>
                <span>${subject}科线 ${s.line}</span>
                <span>你高出 ${s.diff} 分</span>
              </div>
            </div>`).join('')}
          </div>
        </div>`;
      };

      resultBody.innerHTML = group('冲刺', 'chong', chong)
        + group('稳妥', 'wen', wen)
        + group('保底', 'bao', bao)
        + (!chong.length && !wen.length && !bao.length
            ? `<div class="empty"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><p>没有匹配到院校，试试调整分数或科类。</p></div>`
            : '');

      resultSection.style.display = 'block';
      resultSection.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  /* ---------- 联系表单（前端演示） ---------- */
  const cForm = document.getElementById('contactForm');
  if (cForm) {
    cForm.addEventListener('submit', e => {
      e.preventDefault();
      const ok = document.getElementById('formSuccess');
      if (ok) ok.classList.add('show');
      cForm.reset();
    });
  }
})();