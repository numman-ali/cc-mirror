#!/usr/bin/env bash
# Vendor upstream tweakcc into repos/tweakcc for reference.
#
# repos/ is gitignored. We never commit tweakcc; we just pin the commit SHA
# of whatever we ported from in THIRD_PARTY_NOTICES.md so a reviewer can
# diff our ports against a known upstream revision.
#
# Refresh by deleting repos/tweakcc and rerunning this script.

set -euo pipefail

REPO_URL="https://github.com/Piebald-AI/tweakcc.git"
TARGET_DIR="repos/tweakcc"
REF="${1:-main}"

if [ -d "$TARGET_DIR/.git" ]; then
  echo "tweakcc already vendored at $TARGET_DIR" >&2
  echo "delete it and rerun if you want a fresh checkout" >&2
  exit 0
fi

mkdir -p repos
git clone --depth=1 --branch "$REF" "$REPO_URL" "$TARGET_DIR"

cd "$TARGET_DIR"
SHA=$(git rev-parse HEAD)
echo
echo "Vendored tweakcc at $SHA"
echo "Update THIRD_PARTY_NOTICES.md with this SHA when porting code."
