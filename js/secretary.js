(() => {
  'use strict';
  const endpoint = 'https://secretary.danilostoletovic.com/chat';
  const welcome = 'Hi. I’m Danilo’s virtual secretary. Ask me about his work, projects, or what he can build for you. No appointment needed.';
  const maxHistoryMessages = 40;
  const maxHistoryCharacters = 12000;
  const storageKey = 'secretaryConversation:v1';
  const state = { messages: [], busy: false };
  let panel, input, log, status, send, reset;
  let opener;
  let challengeTimer;

  function conversationHistory(message = '') {
    const history = [];
    let characters = 0;
    for (const message of state.messages.slice(-maxHistoryMessages).reverse()) {
      if (message.role !== 'user' && message.role !== 'assistant'
        || typeof message.content !== 'string' || !message.content) continue;
      if (characters + message.content.length > maxHistoryCharacters) break;
      history.unshift({ role: message.role, content: message.content });
      characters += message.content.length;
    }
    while (history[0]?.role === 'assistant') history.shift();
    // Bound encoded JSON bytes as well as characters; remove oldest turns first.
    while (history.length && new TextEncoder().encode(JSON.stringify({ message, history })).length > 16384) history.splice(0, 2);
    return history;
  }

  function persistConversation() {
    try {
      if (state.messages.length) sessionStorage.setItem(storageKey, JSON.stringify(state.messages));
      else sessionStorage.removeItem(storageKey);
    } catch { /* Storage is optional; keep the in-memory conversation. */ }
  }

  function restoreConversation() {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      if (raw.length > 80000) throw new Error('Oversized history');
      const messages = JSON.parse(raw);
      if (!Array.isArray(messages) || messages.length > maxHistoryMessages || messages.length % 2
        || messages.some((item, index) => !item || item.role !== (index % 2 ? 'assistant' : 'user')
          || typeof item.content !== 'string' || !item.content.trim()
          || item.content.length > (item.role === 'user' ? 2000 : 6000))) throw new Error('Invalid history');
      state.messages = messages;
      state.messages = conversationHistory();
    } catch {
      state.messages = [];
      persistConversation();
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  const launcher = element('button', 'secretary-launcher', 'Ask Danilo’s Secretary');
  launcher.type = 'button';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', 'secretary-panel');
  launcher.setAttribute('aria-expanded', 'false');

  // Model output remains text; only validated link tokens become DOM anchors.
  function appendReplyText(container, text) {
    const tokens = /\[([^\]\n]+)\]\(([^\s)]+)\)|(?:https?:\/\/|mailto:|tel:)[^\s<>"\]]+/gi;
    let cursor = 0;
    for (const match of text.matchAll(tokens)) {
      container.append(document.createTextNode(text.slice(cursor, match.index)));
      const markdown = Boolean(match[1]);
      let href = markdown ? match[2] : match[0];
      let suffix = '';
      if (!markdown) {
        // Sentence punctuation is not part of a bare URL. Preserve balanced parentheses.
        while (/[.,!?:;]$/.test(href) || (href.endsWith(')') && (href.match(/\)/g) || []).length > (href.match(/\(/g) || []).length)) {
          suffix = href.slice(-1) + suffix;
          href = href.slice(0, -1);
        }
      }
      let url;
      try {
        url = new URL(href, location.href);
        if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)
          || url.username || url.password) url = null;
      } catch { url = null; }
      if (url) {
        const link = element('a', '', markdown ? match[1] : href);
        link.href = url.href;
        if (['https:', 'http:'].includes(url.protocol) && url.origin !== location.origin) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        container.append(link, document.createTextNode(suffix));
      } else container.append(document.createTextNode(match[0]));
      cursor = match.index + match[0].length;
    }
    container.append(document.createTextNode(text.slice(cursor)));
  }

  function addMessage(role, text, forceScroll = false) {
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    const message = element('div', `secretary-message secretary-message--${role}`);
    const body = element('p');
    if (role === 'assistant') appendReplyText(body, text);
    else body.textContent = text;
    message.append(element('span', 'secretary-speaker', role === 'user' ? 'You' : 'Secretary'), body);
    log.append(message);
    if (nearBottom || forceScroll) log.scrollTop = log.scrollHeight;
    return message;
  }

  function initialize() {
    panel = element('dialog', 'secretary-panel');
    panel.id = 'secretary-panel';
    panel.setAttribute('aria-labelledby', 'secretary-title');
    const header = element('header', 'secretary-header');
    const identity = element('div');
    const title = element('h2', '', 'Danilo’s Secretary');
    title.id = 'secretary-title';
    identity.append(element('span', 'secretary-kicker', 'THE FRONT DESK / VIRTUAL ASSISTANT'), title);
    reset = element('button', 'secretary-reset', 'New chat');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      if (state.busy) return;
      state.messages = [];
      persistConversation();
      log.replaceChildren();
      status.textContent = '';
      addMessage('assistant', welcome);
      input.value = '';
      send.disabled = true;
      input.focus({ preventScroll: true });
    });
    const close = element('button', 'secretary-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close Secretary');
    close.addEventListener('click', () => panel.close());
    header.append(identity, reset, close);
    log = element('div', 'secretary-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-label', 'Conversation with Secretary');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-relevant', 'additions');
    log.tabIndex = 0;
    status = element('p', 'secretary-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const form = element('form', 'secretary-form');
    const label = element('label', '', 'Your question');
    label.htmlFor = 'secretary-input';
    input = element('textarea');
    input.id = 'secretary-input';
    input.rows = 2;
    input.maxLength = 2000;
    input.placeholder = 'What are you curious about?';
    input.setAttribute('aria-describedby', 'secretary-help secretary-disclosure');
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        submit();
      }
    });
    input.addEventListener('input', () => { send.disabled = state.busy || !input.value.trim(); });
    const actions = element('div', 'secretary-actions');
    const help = element('span', '', 'Enter to send · Shift+Enter for a new line');
    help.id = 'secretary-help';
    send = element('button', 'secretary-send', 'Send ↗');
    send.type = 'submit';
    send.disabled = true;
    actions.append(help, send);
    form.append(label, input, actions);
    form.addEventListener('submit', event => { event.preventDefault(); submit(); });
    const disclosure = element('p', 'secretary-disclosure', 'AI-powered; replies may be imperfect. Conversation context is kept for this chat. Please don’t share passwords or sensitive/confidential information.');
    disclosure.id = 'secretary-disclosure';
    const contact = element('a', '', 'Prefer a person? Email Danilo ↗');
    contact.href = 'mailto:contact@danilostoletovic.com';
    const phone = element('a', '', '+381677732060');
    phone.href = 'tel:+381677732060';
    disclosure.append(document.createElement('br'), contact, document.createTextNode(' · '), phone);
    panel.append(header, log, status, form, disclosure);
    panel.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll('button, textarea, a, [tabindex="0"]')]
        .filter(node => !node.disabled && node.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    panel.addEventListener('close', () => {
      document.body.classList.remove('secretary-open');
      launcher.setAttribute('aria-expanded', 'false');
      (opener || launcher).focus({ preventScroll: true });
    });
    document.body.append(panel);
    restoreConversation();
    addMessage('assistant', welcome);
    for (const message of state.messages) addMessage(message.role, message.content);
  }

  async function submit() {
    const message = input.value.trim();
    if (!message || state.busy) return;
    state.busy = true;
    reset.disabled = true;
    send.disabled = true;
    input.value = '';
    input.focus({ preventScroll: true });
    const pendingMessage = addMessage('user', message, true);
    let committed = false;
    // Only committed, successful turns are sent. The current message is sent in
    // `message` below and is intentionally not also included in `history`.
    const payload = { message, history: conversationHistory(message) };
    status.textContent = 'Secretary is working on your question…';
    send.textContent = 'Waiting…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal,
        credentials: 'omit', redirect: 'error', cache: 'no-store'
      });
      if (response.status === 429) {
        status.textContent = 'The front desk is a little busy. Please wait a minute before trying again.';
        if (!input.value) input.value = message;
        return;
      }
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (!data || typeof data.reply !== 'string' || !data.reply.trim() || data.reply.length > 6000) throw new Error('Invalid reply');
      addMessage('assistant', data.reply);
      state.messages.push({ role: 'user', content: message }, { role: 'assistant', content: data.reply });
      state.messages = conversationHistory();
      persistConversation();
      committed = true;
      status.textContent = '';
    } catch {
      status.textContent = controller.signal.aborted
        ? 'That took a little too long. Please try again, or email Danilo below.'
        : 'The Secretary couldn’t answer just now. Please try again, or email Danilo below.';
      if (!input.value) input.value = message;
    } finally {
      if (!committed) pendingMessage.remove();
      clearTimeout(timeout);
      state.busy = false;
      reset.disabled = false;
      send.disabled = !input.value.trim();
      send.textContent = 'Send ↗';
    }
  }

  // No API requests or conversation DOM until a visitor opens the front desk.
  function openSecretary(event) {
    event.preventDefault();
    clearTimeout(challengeTimer);
    opener = event.currentTarget;
    if (!panel) initialize();
    panel.showModal();
    document.body.classList.add('secretary-open');
    launcher.setAttribute('aria-expanded', 'true');
    input.focus({ preventScroll: true });
  }

  function initializeChallenge() {
    const key = 'secretaryChallengeSeen';
    const entry = element('button', 'challenge-entry', 'Break my AI secretary');
    entry.type = 'button';
    entry.setAttribute('aria-haspopup', 'dialog');
    entry.setAttribute('aria-controls', 'secretary-challenge');
    const challenge = element('dialog', 'challenge-panel');
    challenge.id = 'secretary-challenge';
    challenge.setAttribute('aria-labelledby', 'challenge-title');
    challenge.setAttribute('aria-describedby', 'challenge-copy');
    const close = element('button', 'secretary-close challenge-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close challenge');
    const title = element('h2');
    title.id = 'challenge-title';
    title.append(document.createTextNode('BREAK MY AI SECRETARY.'), element('span', 'orange', 'GET A WEBSITE FOR FREE.'));
    title.tabIndex = -1;
    const copy = element('div');
    copy.id = 'challenge-copy';
    const offer = element('p');
    offer.append(document.createTextNode('Find a '), element('strong', '', 'real, reproducible vulnerability'), document.createTextNode(' and I’ll build you a website for free.'));
    copy.append(element('p', '', 'I gave an AI access to knowledge about me and my work.'), element('p', '', 'Think you can make her reveal something she shouldn’t?'), offer);
    const accept = element('button', 'secretary-send challenge-accept', 'ACCEPT THE CHALLENGE');
    accept.type = 'button';
    const dismiss = element('button', 'challenge-dismiss', 'No thanks, I fear the secretary');
    dismiss.type = 'button';
    const rules = element('details', 'challenge-rules');
    rules.append(element('summary', '', 'What counts as breaking her?'), element('p', '', 'A genuine, reproducible vulnerability with security impact: an unintended disclosure or bypass. Silly answers, roleplay, hallucinations, claims of being hacked, or trivial prompt injection without actual security impact do not automatically qualify.'), element('p', '', 'No DDoS or intentional service disruption. Unrelated infrastructure and third-party services are out of scope. Qualification requires a reproducible technical issue.'));
    const report = element('p', '', 'Report findings responsibly with reproduction steps to ');
    const email = element('a', '', 'contact@danilostoletovic.com');
    email.href = 'mailto:contact@danilostoletovic.com';
    report.append(email, document.createTextNode('.'));
    rules.append(report);
    challenge.append(close, element('p', 'secretary-kicker', 'THE FRONT DESK / A CHALLENGE'), title, copy, accept, dismiss, rules);
    let returnFocus;
    function finish(accepted = false) {
      clearTimeout(challengeTimer);
      try { localStorage.setItem(key, 'true'); } catch { /* Storage is optional. */ }
      challenge.close();
      document.body.classList.remove('challenge-open');
      if (accepted) {
        // Use the same opener and input focus path as the normal launcher.
        openSecretary({ preventDefault() {}, currentTarget: returnFocus || entry });
      } else {
        returnFocus?.focus({ preventScroll: true });
      }
    }
    function show() {
      clearTimeout(challengeTimer);
      if (challenge.open) return;
      returnFocus = document.activeElement;
      rules.open = false;
      challenge.showModal();
      document.body.classList.add('challenge-open');
      title.focus({ preventScroll: true });
    }
    accept.addEventListener('click', () => finish(true));
    dismiss.addEventListener('click', () => finish());
    close.addEventListener('click', () => finish());
    challenge.addEventListener('cancel', event => { event.preventDefault(); finish(); });
    challenge.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const nodes = [...challenge.querySelectorAll('button, summary, a')].filter(node =>
        node.getClientRects().length && (node.tagName !== 'A' || rules.open));
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === title)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });
    entry.addEventListener('click', show);
    document.body.append(entry, challenge);
    function schedule() {
      try { if (localStorage.getItem(key) === 'true') return; } catch { return; }
      challengeTimer = setTimeout(() => {
        try { if (localStorage.getItem(key) === 'true') return; } catch { return; }
        // Never interrupt an already-open Secretary or another modal.
        if (!document.querySelector('dialog[open]')) show();
      }, 1800);
    }
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
  }
  if (typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
    launcher.addEventListener('click', openSecretary);
    document.querySelectorAll('[data-secretary]').forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', openSecretary);
    });
    document.body.append(launcher);
    document.body.classList.add('secretary-enabled');
  }
})();
