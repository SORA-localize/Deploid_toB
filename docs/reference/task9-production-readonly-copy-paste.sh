#!/bin/zsh
set -euo pipefail

WORKTREE='/Users/hori/Desktop/Humanoid_curation_website/Deploid_toB/.worktrees/content-platform-migration'
ENV_FILE='/tmp/deploid-production.env'
RESULT_FILE='/tmp/task9-production-readonly-result.json'

cd "$WORKTREE"
vercel env pull "$ENV_FILE" --environment production
node scripts/task9-production-readonly-check.mjs "$ENV_FILE" "$RESULT_FILE"

echo
echo '--- safe summary (secrets omitted) ---'
jq '{checkedAt, database: {identity: .database.identity, environmentMarker: .database.environmentMarker, publicTablesCount: (.database.publicTables | length)}, environmentVariables}' "$RESULT_FILE"
