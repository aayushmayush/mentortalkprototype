/**
 * The money loop, end to end, against the built app.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * `tsc` proves the code compiles and `next build` proves every route renders.
 * Neither can tell you whether the one thing the brief insists on is true:
 *
 *   "the loop: cold start → mentor → request → active chat with the timer
 *    visibly counting and the balance visibly decrementing → end → review
 *    sheet → the review appearing on /reviews. If that loop does not feel
 *    live, the prototype has failed its purpose."
 *
 * So this walks it the way a person would, and asserts on what a person would
 * see: digits that CHANGE, and a balance that goes DOWN. A screenshot proves
 * neither, which is why every check here is a comparison of two readings taken
 * seconds apart rather than a single observation.
 *
 * Run:  node scripts/walkthrough.mjs      (needs the app on :3112 and CDP on :9222)
 */

import { connect, collectConsoleErrors } from './cdp.mjs';

const results = [];
const consoleErrors = [];

function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
}

/** Read the wallet balance out of the app bar's badge. */
const readBalance = (c) =>
  c.evaluate(`(() => {
    const m = document.body.innerText.match(/₹\\s?([\\d,]+)/);
    return m ? Number(m[1].replace(/,/g, '')) : null;
  })()`);

/** Read the session timer as seconds. */
const readTimer = (c) =>
  c.evaluate(`(() => {
    const m = document.body.innerText.match(/\\b(\\d{1,2}):(\\d{2})(?::(\\d{2}))?\\b/);
    if (!m) return null;
    return m[3] ? (+m[1])*3600 + (+m[2])*60 + (+m[3]) : (+m[1])*60 + (+m[2]);
  })()`);

const main = async () => {
  const c = await connect();
  collectConsoleErrors(c, consoleErrors);

  console.log('\n── 1. Cold start ─────────────────────────────────────────');
  await c.goto('/get-started');
  await c.waitForText('Find your perfect');
  check('splash → get-started renders', true);
  await c.clickText('Get Started');
  await c.waitForText('Enter your phone number');
  check('get-started → phone', (await c.bodyText()).includes('Enter your phone number'));

  await c.clickText('Verify');
  await c.waitForText('Enter the 6-digit');
  check('phone → OTP', true, 'autofill filled +91 9876543210');

  await c.clickText('Verify');
  await c.waitForText('Basic Information');
  check('OTP → onboarding', true);

  // ── Wizard: three steps, then the 2s completion hold ──────────────────────
  await c.clickText('Next');
  await c.waitForText('What are you preparing for?');
  check('basic info → category step', true, 'JEE arrives preselected from the demo fixture');

  await c.clickText('Next');
  await c.waitForText('Add your education');
  check('category step → education step', true);

  await c.clickText('Next');
  await c.waitForText('Profile Complete');
  check('education step → completion', true);

  await c.waitForText('Preparing for', { timeout: 20000 });
  check('2s hold → home', (await c.evaluate('location.pathname')).startsWith('/home'));
  await c.waitForText('Home');

  const balanceBefore = await readBalance(c);
  check('wallet badge is readable before the session', balanceBefore !== null, `₹${balanceBefore}`);

  console.log('\n── 2. Mentor → request ───────────────────────────────────');
  await c.goto('/home?tab=chat');
  await c.waitForText('Chat');
  check('chat tab lists mentors', (await c.bodyText()).includes('₹'));

  // The tab's cards carry a "Chat" button each; the first one is the target.
  await c.evaluate(`(() => {
    const btns = [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Chat');
    if (btns[0]) btns[0].click();
    return btns.length;
  })()`);
  await c.waitForText('Request', { timeout: 10000 });
  check('request raised on the chat screen', true, 'the RequestingBar shows where the session will run');

  console.log('\n── 3. The live session ───────────────────────────────────');
  // The mentor accepts on a timer; wait for the meter rather than guessing.
  await c.waitForText('End', { timeout: 30000 });
  const t1 = await readTimer(c);
  const b1 = await readBalance(c);
  check('timer has a first reading', t1 !== null, `${t1}s`);
  check('balance has a first reading at session start', b1 !== null, `₹${b1}`);

  // The core assertion: two readings, seconds apart, both moving.
  await c.sleep(6000);
  const t2 = await readTimer(c);
  const b2 = await readBalance(c);

  check('timer is COUNTING UP', t1 !== null && t2 !== null && t2 > t1, `${t1}s → ${t2}s`);
  check(
    'balance is DECREMENTING',
    b1 !== null && b2 !== null && b2 < b1,
    `₹${b1} → ₹${b2}`,
  );

  console.log('\n── 4. End → review ───────────────────────────────────────');
  await c.clickText('End', { exact: true });
  await c.sleep(600);
  // `End session` is a destructive confirm; if the sheet asks, answer it.
  if ((await c.bodyText()).includes('End Session')) await c.clickText('End Session');
  await c.waitForText('How was your session', { timeout: 15000 });
  check('end → review sheet', true);

  const reviewText = 'Walkthrough test review — the loop works.';
  await c.evaluate(`(() => {
    const ta = document.querySelector('textarea');
    if (!ta) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(reviewText)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await c.sleep(300);

  // A star rating is required before Submit enables; click the 5th star.
  await c.evaluate(`(() => {
    const stars = [...document.querySelectorAll('button')].filter((b) => /star/i.test(b.getAttribute('aria-label') || b.innerText));
    const target = stars[4] || stars[stars.length - 1];
    if (target) target.click();
    return stars.length;
  })()`);
  await c.sleep(400);

  await c.clickText('Submit');
  await c.sleep(1500);
  check('review submitted, sheet closed', !(await c.bodyText()).includes('How was your session'));

  console.log('\n── 5. The review lands on /reviews ───────────────────────');
  await c.goto('/reviews');
  await c.waitForText('Review', { timeout: 10000 });
  const reviewBody = await c.bodyText();
  check(
    'the review is on /reviews',
    reviewBody.includes('Walkthrough test review'),
    reviewBody.includes('Walkthrough test review') ? '' : 'not found in page text',
  );

  console.log('\n── 6. The tier-wrap-up screens ───────────────────────────');
  for (const [path, expect] of [
    ['/edit-profile', 'Edit Profile'],
    ['/edit-profile/categories', 'Select Exams'],
    ['/edit-profile/add-education', 'Add Education'],
    ['/settings', 'Settings'],
    ['/settings/privacy', 'Privacy'],
    ['/settings/blocked', 'Blocked'],
    ['/settings/following', 'Following'],
    ['/settings/help', 'Help'],
    ['/settings/about', 'Mentee'],
    ['/support', 'Support'],
    ['/delete-account', 'Delete'],
    ['/free-chat-offer', 'Free'],
    ['/maintenance', 'Maintenance'],
    ['/force-update', 'Update'],
    ['/reviews', 'Review'],
    ['/wallet', 'Wallet'],
    ['/packages', 'Package'],
    ['/referral', 'Refer'],
  ]) {
    await c.goto(path, { settle: 900 });
    const text = await c.bodyText();
    check(`${path} renders`, text.includes(expect), text.includes(expect) ? '' : `expected "${expect}"`);
  }

  console.log('\n── Console errors ────────────────────────────────────────');
  const real = consoleErrors.filter(
    (e) => !/favicon|Download the React DevTools|net::ERR_/.test(e),
  );
  check('no console errors during the walk', real.length === 0, real.slice(0, 3).join(' | '));

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${'═'.repeat(58)}\n  ${results.length - failed.length}/${results.length} checks passed\n${'═'.repeat(58)}`,
  );
  if (failed.length) {
    console.log('\nFailed:');
    for (const f of failed) console.log(`  · ${f.label} ${f.detail}`);
  }

  c.close();
  process.exit(failed.length ? 1 : 0);
};

main().catch((err) => {
  console.error('\nWALKTHROUGH ABORTED:', err.message);
  console.log('\nPartial results:');
  for (const r of results) console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.label} ${r.detail}`);
  process.exit(2);
});
