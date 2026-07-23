#!/usr/bin/env bash
set -euo pipefail
# Deploy claim email Edge Functions to Supabase.
# Requires: supabase login   OR   export SUPABASE_ACCESS_TOKEN=sbp_...
PROJECT_REF="${SUPABASE_PROJECT_REF:-zhsfjwpwxjeysvstgsus}"
npx supabase functions deploy send-contact-email --project-ref "$PROJECT_REF" --no-verify-jwt
npx supabase functions deploy send-claim-email --project-ref "$PROJECT_REF" --no-verify-jwt
echo "Deployed. Claims will email rani@ / eli@ / ophir@ with attachments."
