#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/aetherion}"
SITE_DIR="${SITE_DIR:-/var/www/aetherion}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
NPM_INSTALL_FLAGS="${NPM_INSTALL_FLAGS:---frozen-lockfile}"
NGINX_SERVICE_NAME="${NGINX_SERVICE_NAME:-nginx}"
RELOAD_NGINX="${RELOAD_NGINX:-true}"

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
}

require_command git
require_command node
require_command pnpm
require_command rsync

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "App directory is not a git repository: $APP_DIR" >&2
  exit 1
fi

mkdir -p "$SITE_DIR"

cd "$APP_DIR"

git fetch "$REMOTE" "$BRANCH"

current_branch="$(git rev-parse --abbrev-ref HEAD)"

if [[ "$current_branch" != "$BRANCH" ]]; then
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
  else
    git checkout -b "$BRANCH" --track "$REMOTE/$BRANCH"
  fi
fi

git pull --ff-only "$REMOTE" "$BRANCH"
# shellcheck disable=SC2086
pnpm install $NPM_INSTALL_FLAGS
pnpm build
rsync -av --delete dist/ "$SITE_DIR/"

if [[ "$RELOAD_NGINX" == "true" ]]; then
  require_command sudo
  require_command systemctl
  sudo -n systemctl reload "$NGINX_SERVICE_NAME"
fi

echo "Deployment finished successfully."
