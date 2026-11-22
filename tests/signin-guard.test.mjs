import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

/**
 * Guards the sign-in fixes so later builds cannot quietly remove them (22 Nov 2026):
 * - after any sign-in, the signed-in view is loaded the same way a reload loads it (afterSignIn);
 * - the bottom menu fades out completely when idle;
 * - scrollbars fade out when idle;
 * - automatic sign-out after 5 minutes with no activity (IDLE_MS).
 * Runs on both the TEST page (staff.html) and the production copy (prod/staff.html).
 */
for (const file of ['staff.html', 'prod/staff.html']) {
  const s = readFileSync(new URL('../' + file, import.meta.url), 'utf8');

  test(`${file}: sign-in success always goes through afterSignIn`, () => {
    assert.equal(s.split('function afterSignIn(j)').length - 1, 1, 'afterSignIn is defined once');
    // Three sign-in handlers call it: email code, password, Google.
    assert.ok(s.split('afterSignIn(j);').length - 1 >= 4, 'defined plus three sign-in calls');
    // The page-load path keeps its own direct call (it reads the full "me" reply).
    assert.equal(s.split('setMe(j); drawTabs(); land(); welcome();').length - 1, 1, 'only the page-load path calls land() directly');
  });

  test(`${file}: bottom menu fades out completely when idle, no sliding`, () => {
    assert.ok(s.includes('body.navfaint #tabs{opacity:.06}'), 'faint state');
    assert.ok(s.includes('body.navhide #tabs{opacity:0;pointer-events:none}'), 'hidden state');
    assert.ok(!s.includes('translateY(140%)'), 'no sliding');
  });

  test(`${file}: scrollbars fade when idle`, () => {
    assert.ok(s.includes("html:not(.sbshow) ::-webkit-scrollbar-thumb{background:transparent!important}"));
    assert.ok(s.includes("classList.add('sbshow')"));
  });

  test(`${file}: automatic sign-out after 5 minutes with no activity`, () => {
    assert.ok(s.includes('const IDLE_MS = 5 * 60 * 1000;'));
  });
}
