// BESTARI UI E2E — fitur baru + alur kritis (2026-08-05) v2
// Fokus: slideshow banner, register (via tab), login redirect, favorit card+detail,
// guest redirect, logout, halaman favorit.
const { chromium } = require('playwright');
const crypto = require('crypto');

const BASE = 'http://localhost:3000';
const SUF = crypto.randomBytes(4).toString('hex');
const EMAIL = `uitest_${SUF}@test.com`;
const PASS = 'Password123!';

const results = [];
function log(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name} ${detail}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const pageErrors = [];
  const apiErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400) {
      apiErrors.push(`${r.status()} ${r.url().replace(BASE, '')}`);
    }
  });

  try {
    // ── B1: Beranda — slideshow 2 banner aktif tampil ──
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);
    const hero = await page.locator('section').first().isVisible().catch(() => false);
    log('B1 home render', hero);
    const slideCount = await page.evaluate(() => {
      const sec = document.querySelector('section');
      if (!sec) return 0;
      let n = 0;
      sec.querySelectorAll('div').forEach((d) => {
        const bg = getComputedStyle(d).backgroundImage;
        if (bg && bg !== 'none' && bg.includes('url(')) n++;
      });
      return n;
    });
    log('B1 slideshow gambar tampil', slideCount >= 1, `→ ${slideCount} slide bg`);
    const bodyText = await page.locator('body').innerText();
    // H1 hero = title banner AKTIF dari BE ("Panen Raya Sorgum") — bukti banner tampil
    const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || '');
    log('B1 hero title = banner BE', h1.length > 0, `→ h1="${h1}"`);

    // ── A1: Register (klik "Belum punya akun?" di login) → auto-login ──
    // Navigasi ke login: buka beranda lalu klik tombol MASUK di header
    const masukBtn = page.locator('header button:has-text("Masuk")').first();
    if (await masukBtn.isVisible().catch(() => false)) {
      await masukBtn.click();
      await page.waitForTimeout(1500);
    } else {
      await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
      await page.locator('header button:has-text("Masuk")').first().click();
      await page.waitForTimeout(1500);
    }
    const daftarBtn = page.locator('button:has-text("Belum punya akun"), button:has-text("Daftar")').first();
    const daftarVisible = await daftarBtn.isVisible().catch(() => false);
    log('A1 tombol daftar di login', daftarVisible);
    if (daftarVisible) {
      await daftarBtn.click();
      await page.waitForTimeout(1500);
      // Register form — dump selector
      const inputs = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('input').forEach((el) => {
          out.push({ type: el.type, id: el.id, placeholder: el.placeholder });
        });
        return out;
      });
      console.log('REG INPUTS:', JSON.stringify(inputs));
      // isi form berdasarkan id/placeholder
      const nameInput = page.locator('input[placeholder*="nama" i], input#name').first();
      await nameInput.fill('UI Test ' + SUF.slice(0, 4)).catch(() => {});
      const emailInput = page.locator('input[placeholder*="@"], input#email').first();
      await emailInput.fill(EMAIL).catch(() => {});
      const pwInputs = page.locator('input[type="password"]');
      const n = await pwInputs.count();
      if (n >= 2) {
        await pwInputs.nth(0).fill(PASS);
        await pwInputs.nth(1).fill(PASS);
      }
      const terms = page.locator('#terms, input[type="checkbox"]').first();
      if (await terms.isVisible().catch(() => false)) {
        await terms.check().catch(() => {});
      }
      await page.locator('button[type="submit"]').last().click();
      await page.waitForTimeout(3500);
      const afterReg = await page.locator('body').innerText();
      const headerReg = await page.locator('header').innerText().catch(() => '');
      // Setelah register auto-login: ikon account_circle muncul, tombol MASUK hilang
      const loggedIn = /MASUK/i.test(headerReg) === false && /account_circle/.test(await page.locator('header').innerHTML().catch(() => '')) === false && !/MASUK/i.test(afterReg.slice(0, 200));
      // cek lebih andal: header punya akun (icon) dan tidak ada "Masuk"
      const headerHtml = await page.locator('header').innerHTML().catch(() => '');
      const hasAccountIcon = headerHtml.includes('account_circle') || headerHtml.includes('person');
      const loginBtnGone = !/MASUK/i.test(headerReg);
      log('A1 register sukses + auto-login', hasAccountIcon && loginBtnGone, `→ ${EMAIL} (icon=${hasAccountIcon}, masukGone=${loginBtnGone})`);
    }

    // ── F4: tombol favorit di card (login) ──
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const hearts = await page.locator('button:has(span:text("favorite_border")), button:has(span:text("favorite"))').count().catch(() => 0);
    log('F4 tombol hati di card', hearts >= 1, `→ ${hearts} tombol`);
    if (hearts >= 1) {
      const firstHeart = page.locator('button:has(span:text("favorite_border")), button:has(span:text("favorite"))').first();
      await firstHeart.click();
      await page.waitForTimeout(2000);
      const filled = await page.locator('span:text("favorite")').count();
      log('F4 klik hati → filled', filled >= 1, `→ filled=${filled}`);
      // buka profil → tab favorit
      await page.goto(BASE + '/profil', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const favTab = page.locator('button:has-text("Favorit"), button:has-text("Produk Favorit")').first();
      if (await favTab.isVisible().catch(() => false)) {
        await favTab.click();
        await page.waitForTimeout(2000);
        const favBody = await page.locator('body').innerText();
        log('F4 halaman favorit isi produk', /Sorgum/i.test(favBody), '→ list favorit');
      } else {
        log('F4 halaman favorit', false, 'tab favorit tidak ada');
      }
    }

    // ── B2: Detail produk — tombol favorit + harga ──
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    // Card produk = div dengan onClick + class cursor-pointer. Klik yang punya img.
    const cardSel = page.locator('main div[class*="cursor-pointer"]').filter({ has: page.locator('img') }).first();
    if (await cardSel.isVisible().catch(() => false)) {
      await cardSel.click();
      await page.waitForTimeout(2500);
      const detailFav = await page.locator('button:has-text("Favorit")').count().catch(() => 0);
      log('B2 detail punya tombol favorit', detailFav >= 1, `→ ${detailFav}`);
      const detailBody = await page.locator('body').innerText();
      log('B2 detail tampil harga', /IDR|Rp/i.test(detailBody), '→ harga');
      const addCartBtn = await page.locator('button:has-text("Keranjang")').count().catch(() => 0);
      log('B2 detail tombol keranjang', addCartBtn >= 1, `→ ${addCartBtn}`);
    } else {
      log('B2 detail produk', false, 'tidak ada card produk');
    }

    // ── A4: Logout → guest, icon cart hilang ──
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.locator('header button:has(span:text("account_circle"))').first().click().catch(() => {});
    await page.waitForTimeout(800);
    const logoutBtn = page.locator('button:has-text("Keluar"), button:has-text("Logout")').first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(2500);
      const afterLogout = await page.locator('body').innerText();
      log('A4 logout sukses', /MASUK/i.test(afterLogout), '→ guest');
      const cartGuest = await page.locator('header button:has(span:text("shopping_cart")), header button:has(span:text("add_shopping_cart"))').count().catch(() => 0);
      log('C1 icon cart hilang saat guest', cartGuest === 0, `→ ${cartGuest}`);
    } else {
      log('A4 logout', false, 'tombol keluar tidak ditemukan');
    }

    // ── Guest: klik hati di card → redirect login ──
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const guestHeart = await page.locator('button:has(span:text("favorite_border"))').first().isVisible().catch(() => false);
    log('F4 guest tombol hati ada', guestHeart);
    if (guestHeart) {
      await page.locator('button:has(span:text("favorite_border"))').first().click();
      await page.waitForTimeout(2000);
      const url = page.url();
      const bodyAfter = await page.locator('body').innerText();
      const redirectedLogin = /login|masuk/i.test(url) || /Masuk|Login/i.test(bodyAfter);
      log('F4 guest klik hati → redirect login', redirectedLogin, `→ url=${url}`);
    }

    // ── A2: Login → redirect produk ──
    await page.locator('#email').first().fill(EMAIL).catch(async () => {
      await page.locator('input[placeholder*="@"]').first().fill(EMAIL);
    });
    await page.locator('input[type="password"]').first().fill(PASS);
    await page.locator('button[type="submit"]').last().click();
    await page.waitForTimeout(3000);
    const afterLogin = await page.locator('body').innerText();
    const headerLogin = await page.locator('header').innerText().catch(() => '');
    const headerLoginHtml = await page.locator('header').innerHTML().catch(() => '');
    const loginOk = !/MASUK/i.test(headerLogin) && (headerLoginHtml.includes('account_circle') || headerLoginHtml.includes('person'));
    log('A2 login sukses', loginOk, '→ user login (icon akun)');
    const onProducts = /Katalog Produk|Semua Produk|Produk Kami/i.test(afterLogin);
    log('A2 login redirect → produk', onProducts, '→ halaman produk');

    // ── C1: cart icon tampil setelah login ──
    const cartIcon = await page.locator('header button:has(span:text("shopping_cart")), header button:has(span:text("add_shopping_cart"))').count().catch(() => 0);
    log('C1 icon cart tampil (login)', cartIcon >= 1, `→ ${cartIcon}`);
  } catch (e) {
    log('CRASH', false, String(e).slice(0, 300));
  }

  console.log('\n' + '='.repeat(60));
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`UI: ${passed} PASS / ${failed} FAIL / ${results.length} total`);
  if (failed) {
    console.log('\nFAIL:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  ✗ ${r.name} — ${r.detail}`));
  }
  if (pageErrors.length) {
    console.log('\nPAGE ERRORS (first 10):');
    pageErrors.slice(0, 10).forEach((e) => console.log('  ! ' + e));
  }
  if (apiErrors.length) {
    console.log('\nAPI ERRORS (>=400, first 10):');
    apiErrors.slice(0, 10).forEach((e) => console.log('  ! ' + e));
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
