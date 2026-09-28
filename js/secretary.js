(() => {
  'use strict';
  // Edit these prompts to change the first-visit suggestions.
  const suggestions = [
    'What can Danilo build for me?',
    'Tell me about his projects.',
    'What technologies does he use?',
    'How can I contact Danilo?'
  ];
  const endpoint = 'https://secretary.danilostoletovic.com/chat';
  const welcome = 'Hi. I’m Danilo’s virtual secretary. Ask me about his work, projects, or what he can build for you. No appointment needed.';
  const state = { messages: [], busy: false };
  let panel, input, log, status, send, prompts;

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

  function addMessage(role, text, forceScroll = false) {
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    state.messages.push({ role, text });
    const message = element('div', `secretary-message secretary-message--${role}`);
    message.append(element('span', 'secretary-speaker', role === 'user' ? 'You' : 'Secretary'), element('p', '', text));
    log.append(message);
    if (nearBottom || forceScroll) log.scrollTop = log.scrollHeight;
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
    const close = element('button', 'secretary-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close Secretary');
    close.addEventListener('click', () => panel.close());
    header.append(identity, close);
    log = element('div', 'secretary-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-label', 'Conversation with Secretary');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-relevant', 'additions');
    log.tabIndex = 0;
    prompts = element('div', 'secretary-prompts');
    suggestions.forEach(question => {
      const button = element('button', '', question);
      button.type = 'button';
      button.addEventListener('click', () => { input.value = question; submit(); });
      prompts.append(button);
    });
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
    const disclosure = element('p', 'secretary-disclosure', 'AI-powered; replies may be imperfect. Each question is answered on its own. Please don’t share passwords or sensitive/confidential information.');
    disclosure.id = 'secretary-disclosure';
    const contact = element('a', '', 'Prefer a person? Email Danilo ↗');
    contact.href = 'mailto:contact@danilostoletovic.com';
    const phone = element('a', '', '+381677732060');
    phone.href = 'tel:+381677732060';
    disclosure.append(document.createElement('br'), contact, document.createTextNode(' · '), phone);
    panel.append(header, log, prompts, status, form, disclosure);
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
      launcher.focus({ preventScroll: true });
    });
    document.body.append(panel);
    addMessage('assistant', welcome);
  }

  async function submit() {
    const message = input.value.trim();
    if (!message || state.busy) return;
    state.busy = true;
    send.disabled = true;
    prompts.hidden = true;
    input.value = '';
    input.focus({ preventScroll: true });
    addMessage('user', message, true);
    status.textContent = 'Secretary is working on your question…';
    send.textContent = 'Waiting…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }), signal: controller.signal,
        credentials: 'omit', redirect: 'error', cache: 'no-store'
      });
      if (response.status === 429) {
        status.textContent = 'The front desk is a little busy. Please wait a minute before trying again.';
        if (!input.value) input.value = message;
        return;
      }
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (!data || typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Invalid reply');
      addMessage('assistant', data.reply);
      status.textContent = '';
    } catch {
      status.textContent = controller.signal.aborted
        ? 'That took a little too long. Please try again, or email Danilo below.'
        : 'The Secretary couldn’t answer just now. Please try again, or email Danilo below.';
      if (!input.value) input.value = message;
    } finally {
      clearTimeout(timeout);
      state.busy = false;
      send.disabled = !input.value.trim();
      send.textContent = 'Send ↗';
    }
  }

  // No API requests or conversation DOM until a visitor opens the front desk.
  launcher.addEventListener('click', () => {
    if (!panel) initialize();
    panel.showModal();
    document.body.classList.add('secretary-open');
    launcher.setAttribute('aria-expanded', 'true');
    input.focus({ preventScroll: true });
  });
  if (typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
    document.body.append(launcher);
    document.body.classList.add('secretary-enabled');
  }
})();
