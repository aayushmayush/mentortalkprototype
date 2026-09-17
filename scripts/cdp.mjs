/**
 * A minimal Chrome DevTools Protocol client, for driving the prototype.
 *
 * ── Why hand-rolled ─────────────────────────────────────────────────────────
 *
 * No browser-automation dependency is installed, and adding one (Playwright or
 * Puppeteer) would pull a whole browser runtime into a prototype that is meant
 * to be opened and clicked. Node 22 ships a global `WebSocket`, so the only
 * thing missing is the CDP framing — a session id, an incrementing message id,
 * and a promise per reply. That is this file.
 *
 * ── Why CDP at all, rather than curl ────────────────────────────────────────
 *
 * The money loop is not observable in HTML. The timer's digits, the wallet
 * badge's balance and the review that lands on /reviews are all client state
 * over time. `curl` sees the first paint and nothing after it, so the one thing
 * the spec insists on — "if that loop does not feel live, the prototype has
 * failed its purpose" — is exactly the thing curl cannot check.
 */

const DEBUG_PORT = process.env.CDP_PORT || '9222';
const BASE = process.env.CDP_BASE || 'http://localhost:3112';

export async function connect() {
  const list = await (await fetch(`http://localhost:${DEBUG_PORT}/json/list`)).json();
  const page = list.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target — is the browser running with --remote-debugging-port?');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const listeners = [];

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id !== undefined) {
      const entry = pending.get(msg.id);
      if (!entry) return;
      pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(JSON.stringify(msg.error)));
      else entry.resolve(msg.result);
      return;
    }
    for (const fn of listeners) fn(msg);
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  /** Evaluate in the page and return the value. Awaits promises. */
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          JSON.stringify(result.exceptionDetails),
      );
    }
    return result.result.value;
  };

  const goto = async (path, { settle = 1200 } = {}) => {
    await send('Page.navigate', { url: `${BASE}${path}` });
    await waitFor(() => evaluate('document.readyState === "complete"'), {
      label: `load ${path}`,
    });
    await sleep(settle);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = async (predicate, { timeout = 15000, label = 'condition' } = {}) => {
    const started = Date.now();
    for (;;) {
      try {
        if (await predicate()) return true;
      } catch {
        // A navigation mid-poll throws; that is not a failure, just a retry.
      }
      if (Date.now() - started > timeout) throw new Error(`timed out waiting for ${label}`);
      await sleep(150);
    }
  };

  /** Text of the whole phone, for assertions and for failure messages. */
  const bodyText = () =>
    evaluate('document.body.innerText.replace(/\\s+/g, " ").trim()');

  /**
   * Block until the phone shows (or stops showing) a phrase.
   *
   * Every wait in the walk goes through this rather than a fixed sleep: the
   * prototype's transitions are timer-driven (a 700ms load, an 800ms save, a
   * 2s completion hold), so a sleep long enough for the slowest one makes the
   * walk slow, and one short enough to be quick makes it flaky. Waiting on the
   * text is both.
   */
  const waitForText = async (text, { timeout = 15000, absent = false } = {}) =>
    waitFor(
      async () => {
        const has = (await bodyText()).includes(text);
        return absent ? !has : has;
      },
      { timeout, label: absent ? `"${text}" to disappear` : `"${text}" to appear` },
    );

  /**
   * Click a control by its label.
   *
   * Buttons first, and exact matches before substring ones — the screen index's
   * own chrome is full of loose text, and a substring search for "Next" happily
   * lands on a paragraph that merely mentions it. Only if no button matches does
   * it fall back to the deepest element containing the text, which is what makes
   * a tappable card (a div with an onClick) reachable.
   */
  const clickText = async (text, { exact = false } = {}) => {
    const clicked = await evaluate(`(() => {
      const wanted = ${JSON.stringify(text)};
      const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
      const hit = (t) => ${exact ? 't === wanted' : 't.includes(wanted)'};

      const controls = [...document.querySelectorAll('button, [role="button"], a')];
      const exactBtn = controls.filter((el) => norm(el.innerText) === wanted);
      const looseBtn = controls.filter((el) => hit(norm(el.innerText)));

      // Disabled controls are reported rather than silently clicked — a stalled
      // walk is otherwise indistinguishable from a broken screen.
      const pick = exactBtn[0] || looseBtn[0];
      if (pick) {
        if (pick.disabled || pick.getAttribute('aria-disabled') === 'true') {
          return { ok: false, why: 'disabled: ' + norm(pick.innerText) };
        }
        pick.click();
        return { ok: true, via: 'button', text: norm(pick.innerText) };
      }

      const all = [...document.querySelectorAll('div, span, p')];
      const deep = all.filter((el) => hit(norm(el.innerText)));
      deep.sort((a, b) => {
        const depth = (el) => { let n = 0; while (el.parentElement) { n++; el = el.parentElement; } return n; };
        return depth(b) - depth(a);
      });
      if (!deep[0]) return { ok: false, why: 'no match' };
      deep[0].click();
      return { ok: true, via: 'div', text: norm(deep[0].innerText).slice(0, 60) };
    })()`);

    if (!clicked.ok) throw new Error(`could not click "${text}": ${clicked.why}`);
    await sleep(400);
    return clicked;
  };

  const on = (fn) => listeners.push(fn);

  const close = () => ws.close();

  return { send, evaluate, goto, sleep, waitFor, waitForText, bodyText, clickText, on, close };
}

/** Console errors are the cheapest way to catch a broken screen. */
export function collectConsoleErrors(client, sink) {
  client.on((msg) => {
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      sink.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      sink.push(
        msg.params.exceptionDetails.exception?.description ||
          msg.params.exceptionDetails.text,
      );
    }
  });
}
