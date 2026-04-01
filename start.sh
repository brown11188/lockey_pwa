#!/bin/sh
set -e

# Source .env.production — force override existing ENV vars
if [ -f "/app/.env.production" ] && [ -r "/app/.env.production" ]; then
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    case "$key" in
      \#*|'') continue ;;
    esac
    export "$key=$value"
  done < /app/.env.production
fi

if [ -z "$AUTH_SECRET" ]; then
  if   [ -n "$NEXTAUTH_SECRET" ]; then export AUTH_SECRET="$NEXTAUTH_SECRET"
  elif [ -n "$NEXT_AUTH_SECRET" ]; then export AUTH_SECRET="$NEXT_AUTH_SECRET"
                                        export NEXTAUTH_SECRET="$NEXT_AUTH_SECRET"
  else echo "WARNING: No AUTH_SECRET found"
  fi
fi

if [ -n "$NEXTAUTH_URL" ]; then
  APP_ROOT=$(echo "$NEXTAUTH_URL" | sed 's|/*$||')
  export AUTH_URL="${APP_ROOT}/api/auth"
  export NEXTAUTH_URL="$APP_ROOT"
fi

exec node server.js

