#!/usr/bin/env bash
# Re-create symlink dist/uploads -> backend/uploads_ecatalog_bestari
# Kenapa: nginx serve dist/ sebagai root; /uploads/* tidak di-proxy ke BE.
# Symlink ini bikin semua upload BE langsung terlihat via domain.
# Wajib dijalankan SETELAH `npm run build` (vite emptyOutDir menghapus dist/).
#
# NOTE: ini WORKAROUND sementara. Fix permanen = tambah `location /uploads`
# di config nginx e-catalog.kolab.top (butuh sudo):
#
#   location /uploads/ {
#       proxy_pass http://127.0.0.1:20203;
#       proxy_set_header Host $host;
#   }
#
# Setelah nginx di-fix, script ini boleh dihapus (dan dist/uploads dihapus).
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
UPLOAD_DIR="$REPO/backend/uploads_ecatalog_bestari"
LINK_PATH="$REPO/dist/uploads"

if [ ! -d "$UPLOAD_DIR" ]; then
  echo "[uploads-symlink] WARN: $UPLOAD_DIR tidak ada — buat dulu?"
  mkdir -p "$UPLOAD_DIR"
fi

if [ -e "$LINK_PATH" ] && [ ! -L "$LINK_PATH" ]; then
  echo "[uploads-symlink] ERROR: $LINK_PATH ada tapi bukan symlink — cek manual"
  exit 1
fi

rm -f "$LINK_PATH"
ln -s "$UPLOAD_DIR" "$LINK_PATH"
echo "[uploads-symlink] OK: $LINK_PATH -> $UPLOAD_DIR"
