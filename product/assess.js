(function () {
    "use strict";

    const state = {
        step: 1,
        province: "",
        subject: "",
        score: "",
        rank: "",
        interests: []
    };
    // 读取 AI 对话框带来的问题
    const q = new URLSearchParams(location.search).get('q');
    if (q) {
        state.aiQuestion = q;
        // 在第 1 步顶部显示
        const hint = document.createElement('div');
        hint.className = 'form-hint';
        hint.style.cssText = 'background:var(--purple-soft);color:var(--purple);padding:12px 16px;border-radius:12px;font-size:14px;margin-bottom:20px';
        hint.textContent = '你刚才问：' + q;
        const firstCard = document.querySelector('.step-panel');
        firstCard && firstCard.prepend(hint);
    }

    const $ = s => document.querySelector(s);
    const steps = document.querySelectorAll('.step');
    const panels = document.querySelectorAll('.step-panel');
    const errEl = $('#formError');

    function showStep(n) {
        state.step = n;
        steps.forEach((s, i) => {
            s.classList.toggle('active', i + 1 === n);
            s.classList.toggle('done', i + 1 < n);
        });
        panels.forEach((p, i) => p.style.display = (i + 1 === n) ? 'block' : 'none');
        window.scrollTo({ top: document.querySelector('.steps-wrap').offsetTop - 80, behavior: 'smooth' });
    }

    function showError(msg) {
        if (!errEl) return;
        errEl.textContent = msg;
        errEl.classList.add('show');
    }
    function clearError() { errEl && errEl.classList.remove('show'); }

    // 分数实时换算位次提示
    const scoreInput = $('#score');
    const rankHint = $('#rankHint');
    if (scoreInput) {
        scoreInput.addEventListener('input', () => {
            const sub = state.subject || '理';
            const v = +scoreInput.value;
            if (v >= 100 && v <= 750 && window.scoreToRank) {
                const r = window.scoreToRank(sub, v);
                if (r && rankHint) rankHint.textContent = `约对应全省位次：${r.toLocaleString()}（示例估算）`;
            } else if (rankHint) {
                rankHint.textContent = '';
            }
        });
    }

    // 第 1 步 → 2
    $('#step1Form')?.addEventListener('submit', e => {
        e.preventDefault();
        const prov = $('#province').value;
        const sub = document.querySelector('input[name="subject"]:checked')?.value;
        if (!prov) { showError('请选择省份'); return; }
        if (!sub) { showError('请选择科类'); return; }
        clearError();
        state.province = prov;
        state.subject = sub;
        showStep(2);
    });

    // 第 2 步 → 3
    $('#step2Form')?.addEventListener('submit', e => {
        e.preventDefault();
        const score = +$('#score').value;
        if (!score || score < 100 || score > 750) { showError('请输入 100–750 之间的分数'); return; }
        clearError();
        state.score = score;
        const rank = +$('#rank').value;
        state.rank = rank || window.scoreToRank(state.subject, score);
        showStep(3);
    });

    // 第 3 步 → 生成
    $('#step3Form')?.addEventListener('submit', e => {
        e.preventDefault();
        state.interests = Array.from(document.querySelectorAll('input[name="interest"]:checked')).map(i => i.value);
        localStorage.setItem('zhitu_assess', JSON.stringify(state));
        window.location.href = 'result.html';
    });

    // 返回
    document.querySelectorAll('[data-back]').forEach(b => {
        b.addEventListener('click', () => { clearError(); showStep(Math.max(1, state.step - 1)); });
    });

    // 恢复上次输入（可选）
    try {
        const saved = JSON.parse(localStorage.getItem('zhitu_assess') || 'null');
        if (saved && saved.province) {
            $('#province').value = saved.province;
            const subEl = document.querySelector(`input[name="subject"][value="${saved.subject}"]`);
            if (subEl) subEl.checked = true;
            state.subject = saved.subject;
            if (saved.score) $('#score').value = saved.score;
            if (saved.rank) $('#rank').value = saved.rank;
        }
    } catch (e) { }

    showStep(1);
})();