(function(){
  "use strict";

  const $ = s => document.querySelector(s);
  const data = JSON.parse(localStorage.getItem('zhitu_assess') || 'null');

  if (!data || !data.score){
    $('#resultRoot').innerHTML = `<div class="empty"><h3>还没有测评数据</h3><p>先完成一次测评，就能看到专属的院校匹配结果。</p><a href="assess.html" class="btn btn-primary">开始测评</a></div>`;
    return;
  }

  const { province, subject, score, rank, interests } = data;
  const myRank = rank || window.scoreToRank(subject, score);

  // 匹配
  const all = window.SCHOOLS.map(s => {
    const line = s.rank[subject];
    const diff = line - myRank; // 正数=我位次更靠前（更有把握）
    let prob = Math.round(50 + diff / 400);
    prob = Math.max(15, Math.min(96, prob));
    let level;
    if (diff > 6000) level = 'bao';
    else if (diff > 1500) level = 'wen';
    else if (diff > -2500) level = 'chong';
    else level = null;
    // 兴趣过滤（仅影响展示排序，不强制排除）
    const hit = interests?.length ? s.majors.some(m => interests.some(i => m.includes(i) || i.includes(m))) : false;
    return {...s, line, diff, prob, level, hit};
  }).filter(s => s.level);

  // 兴趣命中优先
  const sortByHit = (a,b) => (b.hit - a.hit) || (b.prob - a.prob);

  const groups = {
    chong: all.filter(s => s.level === 'chong').sort(sortByHit),
    wen: all.filter(s => s.level === 'wen').sort(sortByHit),
    bao: all.filter(s => s.level === 'bao').sort(sortByHit)
  };

  // 头部
  $('#resultMeta').innerHTML = `${province} · ${subject}科 · <strong>${score} 分</strong> · 位次约 ${myRank.toLocaleString()}`;

  // Tabs
  const tabsHtml = `
    <button class="tab active" data-tab="all">全部 <span class="count">${all.length}</span></button>
    <button class="tab" data-tab="chong">冲刺 <span class="count">${groups.chong.length}</span></button>
    <button class="tab" data-tab="wen">稳妥 <span class="count">${groups.wen.length}</span></button>
    <button class="tab" data-tab="bao">保底 <span class="count">${groups.bao.length}</span></button>`;
  $('#tabs').innerHTML = tabsHtml;

  function probClass(p){ return p >= 70 ? 'prob-high' : p >= 45 ? 'prob-mid' : 'prob-low'; }
  function card(s){
    return `<div class="school-card">
      <div class="school-top">
        <div><h4>${s.name}</h4><div class="prov">${s.prov} · ${s.tier}</div></div>
        <span class="prob-badge ${probClass(s.prob)}">${s.prob}%</span>
      </div>
      <div class="majors">${s.majors.map(m => `<span class="major-tag">${m}</span>`).join('')}</div>
      <div class="school-meta"><span>去年最低位次 ${s.line.toLocaleString()}</span><span>你 ${myRank > s.line ? '低于' : '高于'}线 ${Math.abs(s.diff).toLocaleString()} 位</span></div>
    </div>`;
  }
  function group(title, cls, arr){
    if (!arr.length) return '';
    return `<div class="result-group"><h3><span class="pill ${cls}">${title}</span> ${arr.length} 所</h3><div class="school-list">${arr.map(card).join('')}</div></div>`;
  }

  function render(tab){
    const body = $('#resultBody');
    if (tab === 'all'){
      body.innerHTML = group('冲刺','chong',groups.chong) + group('稳妥','wen',groups.wen) + group('保底','bao',groups.bao)
        || `<div class="empty"><h3>没有匹配到院校</h3><p>试试调整分数或科类。</p><a href="assess.html" class="btn btn-primary">重新测评</a></div>`;
    } else {
      const map = {chong:['冲刺','chong'], wen:['稳妥','wen'], bao:['保底','bao']};
      body.innerHTML = group(map[tab][0], map[tab][1], groups[tab]);
    }
  }
  render('all');

  // tab 切换
  $('#tabs').addEventListener('click', e => {
    const t = e.target.closest('.tab');
    if (!t) return;
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    render(t.dataset.tab);
  });

  // 保存结果
  $('#saveBtn').addEventListener('click', () => {
    const list = JSON.parse(localStorage.getItem('zhitu_saved') || '[]');
    list.unshift({
      ts: Date.now(),
      province, subject, score, rank: myRank,
      counts: {chong: groups.chong.length, wen: groups.wen.length, bao: groups.bao.length}
    });
    localStorage.setItem('zhitu_saved', JSON.stringify(list.slice(0, 3)));
    window.showToast?.('已保存，可在「对比」中查看');
  });

  // 预约（带上下文）
  $('#bookBtn').addEventListener('click', () => {
    const ctx = encodeURIComponent(`${province} ${subject}科 ${score}分 位次${myRank}`);
    window.location.href = `contact.html?from=result&ctx=${ctx}`;
  });
})();