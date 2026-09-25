#!/usr/bin/env bash
# usage: scripts/serve-test.sh [filter]  — starts `next start` on :3100, runs smoke, stops it
cd "$(dirname "$0")/.."
mkdir -p "${SMOKE_DIR:-.smoke}"
if curl -s -o /dev/null localhost:3100; then echo "port 3100 busy"; exit 2; fi
npx next start -p 3100 > "${SMOKE_DIR:-.smoke}/server.log" 2>&1 &
PID=$!
for i in $(seq 1 30); do curl -s -o /dev/null localhost:3100 && break; sleep 0.5; done
node scripts/smoke.mjs http://localhost:3100 "$1"
CODE=$?
kill $PID 2>/dev/null; fuser -k 3100/tcp >/dev/null 2>&1; wait $PID 2>/dev/null
exit $CODE
