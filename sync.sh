#!/bin/sh
# Sync drift.html to the portfolio site
set -e
DEST_DIR="../william-revah-paris/public"
if [ ! -d "$DEST_DIR" ]; then
  echo "error: $DEST_DIR does not exist — refusing to sync into a stray path" >&2
  exit 1
fi
cp drift.html "$DEST_DIR/drift.html"
echo "Synced drift.html → william-revah-paris/public/"
