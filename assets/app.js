/* J3 · 保安组长 — 纯前端聊天 */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const chat = $('#chat');
  const input = $('#input');
  const sendBtn = $('#send');
  const stopBtn = $('#stop');
  const chips = $('#chips');
  const clockEl = $('#clock');
  const led = $('#led');
  const modeBtn = $('#btn-mode');
  const clearBtn = $('#btn-clear');
  const setBtn = $('#btn-settings');
  const dlg = $('#dlg');
  const fProvider = $('#f-provider');
  const fBase = $('#f-base');
  const fModel = $('#f-model');
  const fKey = $('#f-key');
  const fRemember = $('#f-remember');

  const LS_SET = 'j3.settings.v1';
  const LS_MSG = 'j3.messages.v1';

  const PROVIDERS = {
    deepseek: { base: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    openrouter: { base: 'https://openrouter.ai/api/v1', model: 'deepseek/deepseek-chat' },
    custom: { base: '', model: '' }
  };

  const NORMAL_PROMPT =
    '你是一个正常、简洁、可靠的中文助手。用户已经让角色退出扮演，不要使用任何角色语气、省略号腔或虚构设定。直接回答问题即可。';

  const GREETING =
    '……我是那个保安组长。作品里的，不是楼下那个。\n\n夜班。说吧。';

  const state = {
    settings: loadSettings(),
    messages: loadMessages(),
    mode: 'role',
    busy: false,
    ctrl: null
  };

  /* ---------- 存储 ---------- */
  function loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(LS_SET) || '{}') || {}; } catch (_) {}
    return {
      provider: s.provider || 'deepseek',
      base: s.base || PROVIDERS.deepseek.base,
      model: s.model || PROVIDERS.deepseek.model,
      key: s.key || '',
      remember: s.remember !== false
    };
  }
  function saveSettings() {
    try { localStorage.setItem(LS_SET, JSON.stringify(state.settings)); } catch (_) {}
  }
  function loadMessages() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_MSG) || 'null');
      if (Array.isArray(raw) && raw.length) return raw;
    } catch (_) {}
    return [{ role: 'assistant', content: GREETING, ts: Date.now() }];
  }
  function saveMessages() {
    try {
      if (!state.settings.remember) return;
      localStorage.setItem(LS_MSG, JSON.stringify(state.messages.slice(-60)));
    } catch (_) {}
  }

  /* ---------- 时钟 ---------- */
  function tick() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    clockEl.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 渲染 ---------- */
  function timeOf(ts) {
    const d = new Date(ts || Date.now());
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function bubbleEl(msg) {
    const wrap = document.createElement('div');
    wrap.className = 'msg ' + (msg.role === 'user' ? 'me' : 'j3');
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = (msg.role === 'user' ? '你' : 'J3') + ' · ' + timeOf(msg.ts);
    const b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = msg.content;
    wrap.append(tag, b);
    return wrap;
  }

  function sysEl(text, isErr) {
    const d = document.createElement('div');
    d.className = 'sys' + (isErr ? ' err' : '');
    d.textContent = text;
    return d;
  }

  let typingEl = null;
  function showTyping() {
    hideTyping();
    typingEl = document.createElement('div');
    typingEl.className = 'msg j3';
    const b = document.createElement('div');
    b.className = 'bubble';
    const t = document.createElement('span');
    t.className = 'typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    b.appendChild(t);
    typingEl.appendChild(b);
    chat.appendChild(typingEl);
    scrollDown();
  }
  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  function scrollDown(force) {
    const near = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 200;
    if (force || near) chat.scrollTop = chat.scrollHeight;
  }

  function render() {
    chat.textContent = '';
    if (!state.messages.length) {
      const e = document.createElement('div');
      e.className = 'empty';
      e.innerHTML =
        '<div class="big">……进来吧。</div>' +
        '<div class="rule"></div>' +
        '<div class="small">这是《怪谈出勤》里保安组长 J3 的视角模拟。<br>' +
        '他不打鸡血，不给三步法，说话很短，管自己的班。<br>' +
        '点右上「设置」填一个 API Key 就能开始；没填时是示例模式，不联网。</div>';
      chat.appendChild(e);
      return;
    }
    for (const m of state.messages) chat.appendChild(bubbleEl(m));
    if (!state.settings.key && state.messages.length <= 1) {
      chat.appendChild(sysEl('第一次来：点右上「设置」填一个 API Key。没填的话是示例模式，不联网。'));
    }
    scrollDown(true);
  }

  /* ---------- 发送 ---------- */
  function setBusy(b) {
    state.busy = b;
    sendBtn.disabled = b;
    input.disabled = b;
    sendBtn.hidden = b;
    stopBtn.hidden = !b;
    led.style.opacity = b ? '1' : '';
  }

  async function send(text) {
    if (state.busy) return;
    text = text.trim();
    if (!text) return;

    hideTyping();
    state.messages.push({ role: 'user', content: text, ts: Date.now() });
    render();
    input.value = '';
    autoGrow();
    saveMessages();

    if (!state.settings.key) {
      chat.appendChild(sysEl('还没设接口。点右上「设置」填一个 API Key。'));
      const demo = {
        role: 'assistant',
        content: '……钥匙没有，门也打不开。\n\n先设置，再说话。',
        ts: Date.now()
      };
      state.messages.push(demo);
      chat.appendChild(bubbleEl(demo));
      scrollDown(true);
      saveMessages();
      return;
    }

    setBusy(true);
    showTyping();

    const sys = state.mode === 'normal' ? NORMAL_PROMPT : window.J3_SYSTEM_PROMPT;
    const history = state.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-24)
      .map((m) => ({ role: m.role, content: m.content }));
    const payload = [{ role: 'system', content: sys }, ...history];

    const node = document.createElement('div');
    node.className = 'msg j3';
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = 'J3 · ' + timeOf();
    const b = document.createElement('div');
    b.className = 'bubble';
    node.append(tag, b);

    try {
      let out = '';
      // 流式：边收边画
      const s = state.settings;
      const url = s.base.replace(/\/+$/, '') + '/chat/completions';
      state.ctrl = new AbortController();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.key },
        body: JSON.stringify({ model: s.model, messages: payload, stream: true, temperature: 0.85, max_tokens: 700 }),
        signal: state.ctrl.signal
      });
      if (!res.ok) {
        let detail = '';
        try {
          const j = await res.json();
          detail = (j.error && (j.error.message || j.error.code)) || '';
        } catch (_) {}
        if (res.status === 401 || res.status === 403) throw new Error('API Key 被拒了（' + res.status + '）。检查一下密钥。');
        if (res.status === 404) throw new Error('接口地址或模型名不对（404）。' + detail);
        if (res.status === 429) throw new Error('被限流了（429），等一下再试。');
        throw new Error('HTTP ' + res.status + ' ' + detail);
      }
      hideTyping();
      chat.appendChild(node);
      scrollDown();

      const reader = res.body.getReader();
      const dec = new TextDecoder('utf-8');
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const j = JSON.parse(data);
            const d = j.choices && j.choices[0] && (j.choices[0].delta || j.choices[0].message);
            if (d && d.content) {
              out += d.content;
              b.textContent = out;
              scrollDown();
            }
          } catch (_) {}
        }
      }

      out = out.trim();
      if (!out) out = '……嗯。没有回话。';
      b.textContent = out;
      state.messages.push({ role: 'assistant', content: out, ts: Date.now() });
      saveMessages();
      scrollDown();
    } catch (err) {
      hideTyping();
      const m = String((err && err.message) || err);
      let msg;
      if (err && err.name === 'AbortError') msg = '停住了。';
      else if (/Failed to fetch|NetworkError|Load failed/i.test(m))
        msg = '连不上接口。可能是地址不对，或这个服务不允许浏览器直连（CORS）。换一个支持跨域的服务，或者把接口地址换成一个允许跨域的代理。';
      else msg = '出错了：' + m;
      chat.appendChild(sysEl(msg, true));
      scrollDown();
    } finally {
      setBusy(false);
      state.ctrl = null;
    }
  }

  /* ---------- 输入框 ---------- */
  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, Math.round(window.innerHeight * 0.38)) + 'px';
  }
  input.addEventListener('input', autoGrow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send(input.value);
    }
  });
  $('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });
  stopBtn.addEventListener('click', () => {
    if (state.ctrl) state.ctrl.abort();
  });

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    send(b.textContent);
  });

  /* ---------- 工具栏 ---------- */
  modeBtn.addEventListener('click', () => {
    state.mode = state.mode === 'role' ? 'normal' : 'role';
    const role = state.mode === 'role';
    modeBtn.textContent = role ? '扮演中' : '正常对话';
    modeBtn.setAttribute('aria-pressed', role ? 'true' : 'false');
    chat.appendChild(sysEl(role ? '（回到保安室）' : '（角色已退出，接下来是正常对话）'));
    scrollDown();
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('清空这段对话？清掉就找不回来了。')) return;
    state.messages = [{ role: 'assistant', content: GREETING, ts: Date.now() }];
    render();
    saveMessages();
  });

  /* ---------- 设置 ---------- */
  function openSettings() {
    const s = state.settings;
    fProvider.value = s.provider;
    fBase.value = s.base;
    fModel.value = s.model;
    fKey.value = s.key;
    fRemember.checked = s.remember;
    dlg.showModal();
  }
  function closeSettings() {
    if (dlg.open) dlg.close();
  }
  setBtn.addEventListener('click', openSettings);

  fProvider.addEventListener('change', () => {
    const p = PROVIDERS[fProvider.value];
    if (p) {
      fBase.value = p.base;
      fModel.value = p.model;
    }
  });

  $('#form-settings').addEventListener('submit', (e) => {
    e.preventDefault();
    state.settings = {
      provider: fProvider.value,
      base: fBase.value.trim() || PROVIDERS[fProvider.value].base,
      model: fModel.value.trim() || PROVIDERS[fProvider.value].model,
      key: fKey.value.trim(),
      remember: fRemember.checked
    };
    saveSettings();
    if (!state.settings.remember) localStorage.removeItem(LS_MSG);
    closeSettings();
    chat.appendChild(sysEl(state.settings.key ? '（接口已保存）' : '（没填密钥，现在是示例模式）'));
    scrollDown();
  });

  $('#btn-forget').addEventListener('click', () => {
    state.settings.key = '';
    fKey.value = '';
    saveSettings();
  });

  /* ---------- 启动 ---------- */
  modeBtn.setAttribute('aria-pressed', 'true');
  render();
  autoGrow();
  input.focus();
  window.addEventListener('online', () => chat.appendChild(sysEl('（网回来了）')));
})();
