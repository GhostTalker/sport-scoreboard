#!/bin/bash
# =============================================================================
# Sport-Scoreboard - Production Deployment Script
# =============================================================================
#
# Usage: ./deploy.sh [--skip-build] [--force]
#
# Options:
#   --skip-build    Skip npm install and build (use for config-only changes)
#   --force         Deploy even if health check fails (use with caution)
#
# Deployment User: scoreboard-app (NOT root)
# Host: 10.1.0.51
#
# Remote execution:
#   ssh -i "<path-to-ssh-key>" scoreboard-app@10.1.0.51 \
#       "cd /srv/GhostGit/nfl-scoreboard && ./deploy.sh"
#
# Security: This script should be run as the 'scoreboard-app' user,
# which owns /srv/GhostGit/nfl-scoreboard. Never deploy as root.
#
# =============================================================================

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly APP_NAME="nfl-scoreboard"
readonly APP_PORT=3001
readonly HEALTH_ENDPOINT="http://localhost:${APP_PORT}/api/health/ready"
readonly HEALTH_TIMEOUT=30  # seconds to wait for health check
readonly HEALTH_INTERVAL=2  # seconds between health check attempts
readonly BUILDS_DIR="${SCRIPT_DIR}/.builds"
readonly MAX_BUILDS=3  # Keep last N successful builds for rollback
readonly LOG_FILE="${SCRIPT_DIR}/logs/deploy.log"
readonly BRANCH="version-3.0"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Logging Functions
# -----------------------------------------------------------------------------
log() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[${timestamp}]${NC} $1"
    echo "[${timestamp}] $1" >> "${LOG_FILE}" 2>/dev/null || true
}

log_success() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[${timestamp}] SUCCESS:${NC} $1"
    echo "[${timestamp}] SUCCESS: $1" >> "${LOG_FILE}" 2>/dev/null || true
}

log_warning() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[${timestamp}] WARNING:${NC} $1"
    echo "[${timestamp}] WARNING: $1" >> "${LOG_FILE}" 2>/dev/null || true
}

log_error() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[${timestamp}] ERROR:${NC} $1" >&2
    echo "[${timestamp}] ERROR: $1" >> "${LOG_FILE}" 2>/dev/null || true
}

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------
ensure_directories() {
    mkdir -p "${BUILDS_DIR}"
    mkdir -p "${SCRIPT_DIR}/logs"
}

get_git_info() {
    local commit_hash commit_msg branch_name
    commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    commit_msg=$(git log -1 --pretty=%B 2>/dev/null | head -1 || echo "unknown")
    branch_name=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "${branch_name}:${commit_hash} - ${commit_msg}"
}

get_timestamp() {
    date '+%Y%m%d_%H%M%S'
}

# -----------------------------------------------------------------------------
# Health Check Functions
# -----------------------------------------------------------------------------
check_health() {
    local response http_code

    # Use curl to check health endpoint, capture both response and HTTP code
    response=$(curl -s -w "\n%{http_code}" --connect-timeout 5 "${HEALTH_ENDPOINT}" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -1)

    if [[ "$http_code" == "200" ]]; then
        return 0
    else
        return 1
    fi
}

wait_for_health() {
    local elapsed=0
    local status

    log "Waiting for application to become healthy (max ${HEALTH_TIMEOUT}s)..."

    while [[ $elapsed -lt $HEALTH_TIMEOUT ]]; do
        if check_health; then
            log_success "Application is healthy after ${elapsed}s"
            return 0
        fi

        sleep $HEALTH_INTERVAL
        elapsed=$((elapsed + HEALTH_INTERVAL))
        echo -n "."
    done

    echo ""
    log_error "Health check failed after ${HEALTH_TIMEOUT}s"
    return 1
}

# -----------------------------------------------------------------------------
# Build Backup Functions
# -----------------------------------------------------------------------------
backup_current_build() {
    local timestamp build_backup_dir
    timestamp=$(get_timestamp)
    build_backup_dir="${BUILDS_DIR}/${timestamp}"

    if [[ -d "${SCRIPT_DIR}/dist" ]]; then
        log "Backing up current build to ${build_backup_dir}..."
        mkdir -p "${build_backup_dir}"

        # Copy dist directory
        cp -r "${SCRIPT_DIR}/dist" "${build_backup_dir}/"

        # Store metadata
        cat > "${build_backup_dir}/metadata.json" << EOF
{
    "timestamp": "${timestamp}",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "git_message": "$(git log -1 --pretty=%B 2>/dev/null | head -1 | sed 's/"/\\"/g' || echo 'unknown')",
    "node_version": "$(node --version 2>/dev/null || echo 'unknown')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'unknown')",
    "created_at": "$(date -Iseconds)"
}
EOF

        log_success "Build backed up: ${build_backup_dir}"
        echo "${timestamp}"
    else
        log_warning "No existing dist directory to backup"
        echo ""
    fi
}

cleanup_old_builds() {
    local count builds_to_remove

    # Count existing builds
    count=$(ls -1 "${BUILDS_DIR}" 2>/dev/null | wc -l)

    if [[ $count -gt $MAX_BUILDS ]]; then
        builds_to_remove=$((count - MAX_BUILDS))
        log "Cleaning up ${builds_to_remove} old build(s)..."

        # Remove oldest builds (sorted by name which is timestamp)
        ls -1 "${BUILDS_DIR}" | head -n "$builds_to_remove" | while read -r build; do
            rm -rf "${BUILDS_DIR}/${build}"
            log "Removed old build: ${build}"
        done
    fi
}

list_available_builds() {
    log "Available builds for rollback:"
    echo ""

    if [[ -d "${BUILDS_DIR}" ]] && [[ -n "$(ls -A "${BUILDS_DIR}" 2>/dev/null)" ]]; then
        for build_dir in "${BUILDS_DIR}"/*; do
            if [[ -d "$build_dir" ]] && [[ -f "${build_dir}/metadata.json" ]]; then
                local name commit msg
                name=$(basename "$build_dir")
                commit=$(grep '"git_commit"' "${build_dir}/metadata.json" | cut -d'"' -f4 | head -c 8)
                msg=$(grep '"git_message"' "${build_dir}/metadata.json" | cut -d'"' -f4)
                echo "  - ${name} (${commit}: ${msg})"
            fi
        done
    else
        echo "  (no builds available)"
    fi
    echo ""
}

# -----------------------------------------------------------------------------
# Deployment Functions
# -----------------------------------------------------------------------------
pull_latest_code() {
    log "Pulling latest code from ${BRANCH}..."
    git fetch origin
    git checkout "${BRANCH}"
    git pull origin "${BRANCH}"
    log_success "Code updated: $(get_git_info)"
}

install_dependencies() {
    log "Installing dependencies..."
    npm ci --production=false
    log_success "Dependencies installed"
}

build_application() {
    log "Building production bundle..."
    npm run build
    log_success "Build completed"
}

restart_application() {
    log "Restarting PM2 process..."

    # Check if PM2 process exists
    if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
        pm2 restart ecosystem.config.cjs
    else
        pm2 start ecosystem.config.cjs
    fi

    log_success "PM2 process restarted"
}

# -----------------------------------------------------------------------------
# Rollback Function
# -----------------------------------------------------------------------------
rollback_to_build() {
    local build_name="$1"
    local build_path="${BUILDS_DIR}/${build_name}"

    if [[ ! -d "${build_path}" ]]; then
        log_error "Build not found: ${build_name}"
        return 1
    fi

    log "Rolling back to build: ${build_name}..."

    # Replace dist directory
    rm -rf "${SCRIPT_DIR}/dist"
    cp -r "${build_path}/dist" "${SCRIPT_DIR}/"

    # Restart application
    restart_application

    # Verify health
    if wait_for_health; then
        log_success "Rollback to ${build_name} completed successfully"
        return 0
    else
        log_error "Rollback completed but application is not healthy"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# Main Deployment Logic
# -----------------------------------------------------------------------------
deploy() {
    local skip_build=false
    local force=false
    local backup_name=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                skip_build=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    echo ""
    echo "=============================================="
    echo "  Sport-Scoreboard Production Deployment"
    echo "=============================================="
    echo ""

    # Ensure we're in the right directory
    cd "${SCRIPT_DIR}"

    # Setup directories
    ensure_directories

    log "Starting deployment..."
    log "Git info: $(get_git_info)"

    # Backup current build before making changes
    backup_name=$(backup_current_build)

    # Pull latest code
    pull_latest_code

    # Build (unless skipped)
    if [[ "$skip_build" == "false" ]]; then
        install_dependencies
        build_application
    else
        log_warning "Skipping build (--skip-build flag)"
    fi

    # Restart application
    restart_application

    # Health check
    if wait_for_health; then
        # Cleanup old builds on success
        cleanup_old_builds

        echo ""
        echo "=============================================="
        log_success "Deployment completed successfully!"
        echo "=============================================="
        echo ""
        pm2 list
        echo ""
        log "Application running at: http://localhost:${APP_PORT}"
        log "Health endpoint: ${HEALTH_ENDPOINT}"

        return 0
    else
        log_error "Deployment failed - application is not healthy"

        if [[ "$force" == "true" ]]; then
            log_warning "Force flag set - skipping rollback"
            return 1
        fi

        # Attempt rollback
        if [[ -n "$backup_name" ]] && [[ -d "${BUILDS_DIR}/${backup_name}" ]]; then
            log "Attempting automatic rollback to ${backup_name}..."
            if rollback_to_build "$backup_name"; then
                log_success "Automatic rollback successful"
            else
                log_error "Automatic rollback failed - manual intervention required"
            fi
        else
            log_error "No backup available for rollback"
        fi

        return 1
    fi
}

# -----------------------------------------------------------------------------
# Show available builds (for rollback.sh integration)
# -----------------------------------------------------------------------------
show_builds() {
    ensure_directories
    list_available_builds
}

# -----------------------------------------------------------------------------
# Entry Point
# -----------------------------------------------------------------------------
case "${1:-}" in
    --list-builds)
        show_builds
        ;;
    --rollback)
        if [[ -z "${2:-}" ]]; then
            log_error "Usage: $0 --rollback <build_timestamp>"
            show_builds
            exit 1
        fi
        rollback_to_build "$2"
        ;;
    *)
        deploy "$@"
        ;;
esac
