// ============================================================
// Flow checkout E2E — BESTARI E-Catalog
// 1. Login user test (session via API — hemat rate limit auth)
// 2. Tambah produk ke cart
// 3. Apply promo BESTARI10 (modal)
// 4. Submit checkout
// 5. Cek tombol "Konfirmasi via WhatsApp" muncul
// Run: node tests/e2e/flow-checkout.spec.cjs
// Catatan: akun test di-register 1x via API (ensureTestUser);
// login tiap run via apiLogin. Gak kena rate limiter (20 req/15mnt).
// ============================================================
const {
  newBrowser,
  newPage,
  makeChecker,
  ensureTestUser,
  apiLogin,
  gotoHome,
  clickNav,
  addFirstProductToCart,
  applyPromo,
} = require('./helpers.cjs');

(async () => {
  const { check, summary } = makeChecker();
  const browser = await newBrowser();
  const page = await newPage(browser);

  try {
    // 0. Setup akun test (1x register via API kalau belum ada)
    const ensure = await ensureTestUser();
    console.log(`[setup] test user: ${ensure.created ? 'created' : 'exists'} (${ensure.status})`);
    await apiLogin(page);
    await gotoHome(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const bodyAfterLogin = await page.locator('body').innerText().catch(() => '');
    check('login: user ter-login (MASUK hilang)', !bodyAfterLogin.includes('MASUK'), '');

    // 1. Tambah produk
    const added = await addFirstProductToCart(page);
    check('tambah produk ke cart', added);

    // 2. Promo
    const promo = await applyPromo(page, 'BESTARI10');
    check('promo BESTARI10 ke-apply', promo);
    if (promo) {
      const cartTxt = await page.locator('body').innerText().catch(() => '');
      check('diskon tampil di cart', cartTxt.includes('Promo Terpasang') || cartTxt.includes('- Rp 15.000'), '');
    }

    // 3. Checkout
    const checkBtn = page.locator('button:has-text("Lanjut ke Checkout")').first();
    if (await checkBtn.count()) {
      await checkBtn.click();
      await page.waitForTimeout(2500);
    }
    const coTxt = await page.locator('body').innerText().catch(() => '');
    check('halaman checkout', coTxt.includes('Checkout') || coTxt.includes('Pembayaran'), '');

    // Isi form checkout
    const coInputs = await page.locator('input').all();
    for (const inp of coInputs) {
      const ph = (await inp.getAttribute('placeholder').catch(() => '')) || '';
      const p = ph.toLowerCase();
      if (p.includes('nama')) await inp.fill('E2E User');
      else if (p.includes('wa') || p.includes('phone') || p.includes('telepon')) await inp.fill('081234567890');
      else if (p.includes('alamat') || p.includes('address')) await inp.fill('Jl E2E No 1');
      else if (p.includes('kota') || p.includes('city')) await inp.fill('Yogyakarta');
      else if (p.includes('provinsi') || p.includes('province')) await inp.fill('DIY');
      else if (p.includes('kodepos') || p.includes('postal')) await inp.fill('55281');
    }
    const submitCo = page.locator('button[type="submit"], button:has-text("Buat Pesanan"), button:has-text("Pesan")').first();
    if (await submitCo.count()) {
      await submitCo.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: '/tmp/e2e_success.png' }).catch(() => {});

    // 4. Cek tombol WA (OrderSuccessPage)
    const waBtn = page.locator('a[href*="wa.me"]').first();
    const hasWa = (await waBtn.count()) > 0;
    check('OrderSuccess: tombol WA muncul', hasWa);
    if (hasWa) {
      const href = (await waBtn.getAttribute('href')) || '';
      check('WA pakai nomor settings', href.includes('6281234567890'), href.slice(0, 60));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
    await page.screenshot({ path: '/tmp/e2e_error.png' }).catch(() => {});
  }

  await browser.close();
  summary();
})();
