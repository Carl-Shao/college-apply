(function(){
  "use strict";

  const header = document.getElementById('header');
  if (header){
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  document.querySelectorAll('[data-dropdown]').forEach(item => {
    const btn = item.querySelector('.nav-link');
    if (!btn) return;
    const open = () => { item.classList.add('open'); btn.setAttribute('aria-expanded','true'); };
    const close = () => { item.classList.remove('open'); btn.setAttribute('aria-expanded','false'); };
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);
    btn.addEventListener('click', e => { e.preventDefault(); item.classList.contains('open') ? close() : open(); });
    document.addEventListener('click', e => { if(!item.contains(e.target)) close(); });
  });

  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu){
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      burger.classList.toggle('active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('.m-toggle').forEach(t => {
      if (t.tagName === 'BUTTON'){
        t.addEventListener('click', () => {
          const g = t.parentElement;
          const isOpen = g.classList.toggle('open');
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

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, {threshold:.15});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  window.showToast = function(msg){
    let t = document.querySelector('.toast');
    if (!t){ t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  };
})();

  /* ================= 登录态：header 右侧渲染 ================= */
  const headerCta = document.querySelector('.header-cta');
  if (headerCta){
    // 保留原来的汉堡按钮，清掉旧的 CTA 链接
    const burger = headerCta.querySelector('.burger');
    headerCta.innerHTML = '';
    if (burger) headerCta.appendChild(burger);

    const loginArea = document.createElement('div');
    loginArea.className = 'login-area';
    headerCta.insertBefore(loginArea, burger || null);

    function getUser(){
      try { return JSON.parse(localStorage.getItem('zhitu_user') || 'null'); }
      catch(e){ return null; }
    }

    function renderAuth(){
      const user = getUser();
        if (!user) {
            loginArea.innerHTML = `
    <a class="login-text-link" id="loginBtn" href="login.html?redirect=${encodeURIComponent(location.pathname.split('/').pop() || 'index.html')}">登录 / 注册</a>
  `;
            return;
        }
      const initial = (user.nickname || 'U').slice(-2, -1) || 'U';
      loginArea.innerHTML = `
        <div class="user-menu" id="userMenu">
          <button class="user-trigger" id="userTrigger" aria-haspopup="true" aria-expanded="false">
            <span class="user-avatar">${initial}</span>
            <span class="user-name">${user.nickname}</span>
            <span class="caret"></span>
          </button>
          <div class="user-dropdown" id="userDropdown">
            <a href="profile.html">我的档案</a>
            <a href="compare.html">我的对比</a>
            <a href="assess.html">开始测评</a>
            <button type="button" id="logoutBtn">退出登录</button>
          </div>
        </div>
      `;
      const trigger = document.getElementById('userTrigger');
      const dd = document.getElementById('userDropdown');
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const open = dd.classList.toggle('open');
        trigger.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', e => {
        if (!dd.contains(e.target) && e.target !== trigger){
          dd.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('zhitu_user');
        renderAuth();
        if (window.showToast) window.showToast('已退出登录');
      });
    }

    renderAuth();
  }