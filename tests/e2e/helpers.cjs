// ============================================================
// E2E helper — BESTARI E-Catalog
// Reusable: browser setup, assertions, auth, navigation, cart/checkout.
// Dipakai oleh semua *.spec.js di folder ini.
// Catatan penting:
//  - Login/Register di app ini adalah TAB STATE (activeTab), bukan route URL.
//  - BE punya rate limiter auth (20 req / 15 mnt / IP). Hindari register/login
//    berulang: register 1x via API, simpan kredensial, login ulang tiap run.
// ============================================================
const { chromium } = require('playwright');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.E2E_API_URL || 'http://localhost:20203/api';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@bestari.id';
const ADMIN_PASS = process.env.E2E_ADMIN_PASS || 'admin123';
// Akun test reusable (di-register 1x via API, login ulang tiap run)
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e_test@t.com';
const TEST_PASS = process.env.E2E_TEST_PASS || 'secret123';

// ---------- API (langsung, hemat rate limit) ----------
async function api(method, path, body) {
  const res = await fetch(API_URL + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// Login via API -> inject session ke localStorage (bypass UI login, hemat rate limit)
// Ini dipakai buat SETUP akun; flow login UI tetap diuji terpisah.
async function apiLogin(page, { email = TEST_EMAIL, password = TEST_PASS } = {}) {
  const { status, json } = await api('POST', '/auth/login', { email, password });
  if (status !== 200) throw new Error(`apiLogin gagal (${status}): ${JSON.stringify(json).slice(0, 150)}`);
  const { user, token } = json.data || {};
  // Pastikan page di origin app + DOM siap (localStorage baru accessible setelah document load)
  await page.goto(BASE_URL + '/', { waitUntil: 'load' }).catch((e) => console.log('  [apiLogin] goto err:', e.message.slice(0, 80)));
  await page.waitForTimeout(1000);
  const curUrl = page.url();
  if (!curUrl.startsWith(BASE_URL)) {
    throw new Error(`apiLogin: page bukan di origin app (${curUrl})`);
  }
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('bestari_current_user', JSON.stringify(user));
    localStorage.setItem('bestari_token', token || '');
    localStorage.setItem('bestari_orders', '[]');
  }, { user, token });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
}

// Register akun test 1x via API (kalau belum ada). Dipanggil di setup spec.
async function ensureTestUser() {
  const { status, json } = await api('POST', '/auth/register', {
    name: 'E2E Test User',
    email: TEST_EMAIL,
    password: TEST_PASS,
    confirmPassword: TEST_PASS,
  });
  // 201 = baru dibuat; 4xx/duplicate = udah ada -> ok
  return { created: status === 201, status, json };
}

// ---------- Browser ----------
async function newBrowser(options = {}) {
  return chromium.launch({ headless: true, ...options });
}

async function newPage(browser) {
  return browser.newPage({ viewport: { width: 1280, height: 900 } });
}

// ---------- Assertions ----------
function makeChecker() {
  const results = [];
  const check = (name, cond, detail = '') => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  };
  const summary = () => {
    const passed = results.filter((r) => r.pass).length;
    console.log(`\n===== ${passed}/${results.length} PASS =====`);
    return { passed, total: results.length, results };
  };
  return { check, summary };
}

// ---------- Navigation (tab-state app) ----------
async function gotoHome(page) {
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
}

// Klik nav item di header (BERANDA/PRODUK/INFORMASI/FAQ/MASUK/dll)
async function clickNav(page, label) {
  const el = page.locator(`a:has-text("${label}"), button:has-text("${label}")`).first();
  if (await el.count()) {
    await el.click();
    await page.waitForTimeout(1200);
    return true;
  }
  return false;
}

// ---------- Auth ----------
// Daftar user baru via UI (tab register). Field: name, email, password, confirm, terms checkbox.
async function registerUser(page, { name, email, password }) {
  await gotoHome(page);
  await clickNav(page, 'MASUK');
  await page.waitForTimeout(800);
  // "Daftar Sekarang" link di LoginPage
  const daftarBtn = page.locator('button:has-text("Daftar Sekarang"), a:has-text("Daftar")').first();
  if (await daftarBtn.count()) {
    await daftarBtn.click();
    await page.waitForTimeout(1000);
  }
  // Isi form register
  const inputs = page.locator('input');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    const type = (await inp.getAttribute('type').catch(() => '')) || '';
    const ph = (await inp.getAttribute('placeholder').catch(() => '')) || '';
    const p = (type + ' ' + ph).toLowerCase();
    if (p.includes('nama')) await inp.fill(name);
    else if (p.includes('email')) await inp.fill(email);
    else if (p.includes('password') || p.includes('sandi') || p.includes('•')) await inp.fill(password);
  }
  // Checkbox Syarat & Ketentuan
  const terms = page.locator('input[type="checkbox"]').first();
  if (await terms.count()) {
    await terms.check().catch(() => terms.click({ force: true }).catch(() => {}));
  }
  await page.screenshot({ path: '/tmp/e2e_register_filled.png' }).catch(() => {});
  // Submit
  const submit = page.locator('button[type="submit"]').first();
  if (await submit.count()) {
    await submit.click();
    await page.waitForTimeout(2500);
  }
  // Log state: error message atau berhasil
  const errTxt = await page.locator('body').innerText().catch(() => '');
  if (errTxt.includes('gagal') || errTxt.includes('error') || errTxt.includes('Gagal')) {
    console.log('  [registerUser] ERROR TERDETEKSI:', errTxt.slice(0, 150).replace(/\n/g, ' '));
  }
}

// Login admin via UI (tab login). Buat test admin.
async function loginUser(page, { email, password }) {
  await gotoHome(page);
  await clickNav(page, 'MASUK');
  await page.waitForTimeout(800);
  const inputs = page.locator('input');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const inp = inputs.nth(i);
    const type = (await inp.getAttribute('type').catch(() => '')) || '';
    const ph = (await inp.getAttribute('placeholder').catch(() => '')) || '';
    const p = (type + ' ' + ph).toLowerCase();
    if (p.includes('email')) await inp.fill(email);
    else if (p.includes('password') || p.includes('sandi')) await inp.fill(password);
  }
  const submit = page.locator('button[type="submit"]').first();
  if (await submit.count()) {
    await submit.click();
    await page.waitForTimeout(2500);
  }
}

// ---------- Cart & Checkout ----------
async function addFirstProductToCart(page) {
  // Buka tab PRODUK, tambah produk pertama
  await gotoHome(page);
  await clickNav(page, 'PRODUK');
  const addBtn = page
    .locator('button:has-text("Keranjang"), button:has-text("Tambah"), button[aria-label*="tambah"], button:has-text("add_shopping_cart")')
    .first();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

// Buka cart (icon shopping_cart di header — app ini TAB-STATE, bukan URL)
async function openCart(page) {
  const cartIcon = page.locator('a[href*="cart"], button[aria-label*="cart"], a:has-text("shopping_cart"), button:has-text("shopping_cart")').first();
  if (await cartIcon.count()) {
    await cartIcon.click();
    await page.waitForTimeout(1500);
    return true;
  }
  // fallback: cari icon material "shopping_cart"
  const icon = page.locator('.material-symbols-outlined:has-text("shopping_cart")').first();
  if (await icon.count()) {
    await icon.click();
    await page.waitForTimeout(1500);
    return true;
  }
  return false;
}

// Buka cart + apply promo BESTARI10
// Flow: klik baris "Gunakan Promo"/"Voucher" -> modal promo -> isi kode -> apply
async function applyPromo(page, code = 'BESTARI10') {
  const opened = await openCart(page);
  if (!opened) return false;

  // Buka modal promo — trigger-nya DIV (onClick), class cursor-pointer di-strip.
  // Robust selector: div yang mengandung text "Gunakan Promo" + class bg-[#fff8f2]
  const promoRow = page
    .locator('div:has-text("Gunakan Promo"), div:has-text("Promo Terpasang"), div:has-text("Use Promo Code")')
    .first();
  if (await promoRow.count()) {
    await promoRow.click();
    await page.waitForTimeout(1200);
  }

  // Isi kode di modal
  const promoInput = page.locator('input[placeholder*="promo"], input[placeholder*="kode"], input[placeholder*="KODE"]').first();
  if (await promoInput.count()) {
    await promoInput.fill(code);
    const applyBtn = page.locator('button:has-text("Terapkan"), button:has-text("Pakai"), button:has-text("Gunakan"), button:has-text("Apply"), button:has-text("Terapkan Kode")').first();
    if (await applyBtn.count()) await applyBtn.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

module.exports = {
  BASE_URL,
  API_URL,
  ADMIN_EMAIL,
  ADMIN_PASS,
  TEST_EMAIL,
  TEST_PASS,
  api,
  apiLogin,
  ensureTestUser,
  newBrowser,
  newPage,
  makeChecker,
  gotoHome,
  clickNav,
  registerUser,
  loginUser,
  addFirstProductToCart,
  openCart,
  applyPromo,
};
