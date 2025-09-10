#!/usr/bin/env bash
set -euo pipefail
NAME="hl-ingenit-v1"
TS="$(date +"%Y%m%d-%H%M%S")"

mkdir -p backups

git add -A
git commit -m "deploy $NAME $TS" || true
git tag -f "deploy-$TS"
git push --follow-tags

git archive -o "backups/${NAME}-${TS}.zip" --format=zip HEAD

URL="$(vercel --prod --confirm 2>&1 | awk '/https?:\/\/[^ ]*vercel\.app/{u=$1} END{print u}')"
vercel inspect "$URL" --json > "backups/${NAME}-${TS}.json"
printf "%s\n" "$URL" > "backups/${NAME}-${TS}.url"
echo "OK -> $URL"
