#!/bin/sh
# Sync drift.html to the portfolio site.
# Refuses when the destination carries edits this repo never had: a fix made in the hub (2026-10-13)
# would otherwise be overwritten in silence. Back-port first: cp ../william-revah-paris/public/drift.html drift.html
set -e
DEST_DIR="../william-revah-paris/public"
DEST="$DEST_DIR/drift.html"
if [ ! -d "$DEST_DIR" ]; then
  echo "error: $DEST_DIR does not exist — refusing to sync into a stray path" >&2
  exit 1
fi
if [ -f "$DEST" ] && ! cmp -s "$DEST" drift.html && ! git show HEAD:drift.html 2>/dev/null | cmp -s - "$DEST"; then
  echo "error: $DEST differs from both the working copy and HEAD — it holds edits made in the hub." >&2
  echo "       Back-port them first: cp $DEST drift.html && git diff" >&2
  exit 1
fi
cp drift.html "$DEST"
echo "Synced drift.html → william-revah-paris/public/"
