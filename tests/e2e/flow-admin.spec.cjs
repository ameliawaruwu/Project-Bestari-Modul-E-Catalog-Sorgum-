// ============================================================
// Flow admin E2E — BESTARI E-Catalog
// 1. Login admin
// 2. Buka Kelola Transaksi
// 3. Cek dropdown verifikasi payment (unpaid/paid/confirmed) ADA
// Run: node tests/e2e/flow-admin.spec.js
// ============================================================
const {
  newBrowser,
  newPage,
  makeChecker,
  loginUser,
  ADMIN_EMAIL,
  ADMIN_PASS,
} = require('./helpers.cjs');

(async () => {
  const { check, summary } = makeChecker();
  const browser = await newBrowser();
  const page = await newPage(browser);

  try {
    // 1. Login admin
    await loginUser(page, { email: ADMIN_EMAIL, password: ADMIN_PASS });
    const bodyTxt = await page.locator('body').innerText().catch(() => '');
    check('login admin sukses (menu MASUK hilang)', !bodyTxt.includes('MASUK'), '');

    // 2. Buka admin (klik "Halaman Admin" di dropdown profil)
    // AdminPage = tab 'admin' — cek lewat header
    const adminBtn = page.locator('button:has-text("Halaman Admin"), a:has-text("Halaman Admin")').first();
    if (await adminBtn.count()) {
      await adminBtn.click();
      await page.waitForTimeout(2500);
    }
    // fallback: click icon profil → dropdown
    const adminTxt = await page.locator('body').innerText().catch(() => '');
    check('halaman admin kebuka', adminTxt.includes('Dashboard') || adminTxt.includes('Kelola'), adminTxt.slice(0, 80).replace(/\n/g, ' '));

    // 3. Buka tab Transaksi
    const transBtn = page.locator('button:has-text("Transaksi"), a:has-text("Transaksi"), span:has-text("Transaksi")').first();
    if (await transBtn.count()) {
      await transBtn.click();
      await page.waitForTimeout(2000);
    }
    const transTxt = await page.locator('body').innerText().catch(() => '');
    check('tab transaksi kebuka', transTxt.includes('Kelola Transaksi'), '');
    // Cek dropdown payment ada
    const paySelect = page.locator('select option:has-text("Belum Bayar"), select option:has-text("Terverifikasi")').first();
    check('dropdown verifikasi payment ada', (await paySelect.count()) > 0);
    await page.screenshot({ path: '/tmp/e2e_admin_trans.png' }).catch(() => {});
  } catch (e) {
    console.log('ERROR:', e.message);
    await page.screenshot({ path: '/tmp/e2e_admin_error.png' }).catch(() => {});
  }

  await browser.close();
  summary();
})();
