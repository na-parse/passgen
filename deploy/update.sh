#!/usr/bin/env bash

set -e
FORCE=false
[[ "$1" == "force" ]] && FORCE=true

RUNDIR="$(pwd)"
REPO="na-parse/passgen.git"
INSTALL_DIR="/var/www/passgen"
DOT_SERVICE="passgen.service"

DEPLOY_DIR="${INSTALL_DIR}/deploy"
SERVICE_SOURCE="${DEPLOY_DIR}/${DOT_SERVICE}"
SYSTEMD_SERVICE="/etc/systemd/system/${DOT_SERVICE}"

# Pre-run checks
if [ ! -d "$INSTALL_DIR" ]; then
    echo "FATAL: INSTALL_DIR \"$INSTALL_DIR\" does not exist/is not a dir"
    exit 1
fi

# Reload systemd daemon in case service file was updated
sudo systemctl daemon-reload


# Check if a new pull is required
cd "$INSTALL_DIR"
COMMIT_LOCAL=$(git rev-parse HEAD)
git fetch origin main --quiet
COMMIT_REMOTE=$(git rev-parse origin/main)

if [ "${COMMIT_LOCAL}" = "${COMMIT_REMOTE}" ]; then
    if [ "${FORCE}" = "true" ]; then
        echo "No updates, already at ${COMMIT_LOCAL:0:7} (force mode, continuing)"
    else
        echo "No updates, already at ${COMMIT_LOCAL:0:7}"
        cd "$RUNDIR"
        exit 0
    fi
fi

# Pull update and rebuild site
echo "=== Update available: ${COMMIT_LOCAL:0:7} → ${COMMIT_REMOTE:0:7}"
git pull origin main
echo

# Service File Setup/Validation (after pull so the file is present)
if [[ ! -L "$SYSTEMD_SERVICE" ]] || [[ "$(readlink "$SYSTEMD_SERVICE")" != "$SERVICE_SOURCE" ]]; then
    echo "Installing/updating systemd service file: $DOT_SERVICE"
    sudo ln -sf "$SERVICE_SOURCE" "$SYSTEMD_SERVICE"
fi
sudo systemctl daemon-reload

echo "=== Rebuilding deployment ..."
bun install --frozen-lockfile
bun run build

# Restart service
echo "Restarting ${DOT_SERVICE} ..."
sudo systemctl restart "$DOT_SERVICE" || RESTART_FAILED=true

if [ "${RESTART_FAILED}" = "true" ]; then
    echo "ERROR: Issue restarting ${DOT_SERVICE} !!!"
    cd "$RUNDIR"
    EXITVALUE=1
else
    EXITVALUE=0
    sleep 5 # Give the server a moment to fully start before status output
    echo "=== Service Restart Completed:"
fi

# Final Exist Status and Report
sudo systemctl status "${DOT_SERVICE}" -l --no-pager
cd "$RUNDIR"
exit $EXITVALUE