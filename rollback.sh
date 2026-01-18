#!/bin/bash
# =============================================================================
# Sport-Scoreboard - Rollback Script
# =============================================================================
#
# Usage:
#   ./rollback.sh                    # Interactive - shows builds and prompts
#   ./rollback.sh <build_timestamp>  # Direct rollback to specific build
#   ./rollback.sh --latest           # Rollback to most recent backup
#   ./rollback.sh --list             # List available builds
#
# This script restores a previous build from the .builds directory.
# Builds are created automatically by deploy.sh before each deployment.
#
# =============================================================================

set -e
set -o pipefail

# -----------------------------------------------------------------------------
# Configuration (must match deploy.sh)
# -----------------------------------------------------------------------------
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly APP_NAME="nfl-scoreboard"
readonly APP_PORT=3001
readonly HEALTH_ENDPOINT="http://localhost:${APP_PORT}/api/health/ready"
readonly HEALTH_TIMEOUT=30
readonly HEALTH_INTERVAL=2
readonly BUILDS_DIR="${SCRIPT_DIR}/.builds"
readonly LOG_FILE="${SCRIPT_DIR}/logs/rollback.log"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

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
# Health Check
# -----------------------------------------------------------------------------
check_health() {
    local response http_code
    response=$(curl -s -w "\n%{http_code}" --connect-timeout 5 "${HEALTH_ENDPOINT}" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -1)
    [[ "$http_code" == "200" ]]
}

wait_for_health() {
    local elapsed=0
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
# Build Management
# -----------------------------------------------------------------------------
get_available_builds() {
    if [[ -d "${BUILDS_DIR}" ]]; then
        ls -1 "${BUILDS_DIR}" 2>/dev/null | sort -r
    fi
}

get_latest_build() {
    get_available_builds | head -1
}

get_build_count() {
    get_available_builds | wc -l
}

show_build_info() {
    local build_name="$1"
    local build_path="${BUILDS_DIR}/${build_name}"

    if [[ -f "${build_path}/metadata.json" ]]; then
        echo ""
        echo -e "${CYAN}Build: ${build_name}${NC}"
        echo "----------------------------------------"

        local commit branch msg node_ver created
        commit=$(grep '"git_commit"' "${build_path}/metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
        branch=$(grep '"git_branch"' "${build_path}/metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
        msg=$(grep '"git_message"' "${build_path}/metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
        node_ver=$(grep '"node_version"' "${build_path}/metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
        created=$(grep '"created_at"' "${build_path}/metadata.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")

        echo "  Branch:  ${branch}"
        echo "  Commit:  ${commit}"
        echo "  Message: ${msg}"
        echo "  Node:    ${node_ver}"
        echo "  Created: ${created}"
        echo "----------------------------------------"
    else
        echo ""
        echo -e "${YELLOW}Build: ${build_name} (no metadata)${NC}"
    fi
}

list_builds() {
    local builds count

    echo ""
    echo "=============================================="
    echo "  Available Builds for Rollback"
    echo "=============================================="

    builds=$(get_available_builds)
    count=$(echo "$builds" | grep -c . 2>/dev/null || echo "0")

    if [[ $count -eq 0 ]]; then
        echo ""
        echo "  No builds available."
        echo "  Builds are created automatically during deployment."
        echo ""
        return 1
    fi

    echo ""
    echo "Found ${count} build(s):"

    local index=1
    while IFS= read -r build; do
        if [[ -n "$build" ]]; then
            local commit msg
            if [[ -f "${BUILDS_DIR}/${build}/metadata.json" ]]; then
                commit=$(grep '"git_commit"' "${BUILDS_DIR}/${build}/metadata.json" 2>/dev/null | cut -d'"' -f4 | head -c 8 || echo "?")
                msg=$(grep '"git_message"' "${BUILDS_DIR}/${build}/metadata.json" 2>/dev/null | cut -d'"' -f4 | head -c 50 || echo "?")
            else
                commit="?"
                msg="(no metadata)"
            fi
            echo ""
            echo -e "  ${CYAN}[${index}]${NC} ${build}"
            echo "      ${commit}: ${msg}"
            ((index++))
        fi
    done <<< "$builds"

    echo ""
    echo "=============================================="
    echo ""
}

# -----------------------------------------------------------------------------
# Rollback Execution
# -----------------------------------------------------------------------------
perform_rollback() {
    local build_name="$1"
    local build_path="${BUILDS_DIR}/${build_name}"

    # Validate build exists
    if [[ ! -d "${build_path}" ]]; then
        log_error "Build not found: ${build_name}"
        list_builds
        return 1
    fi

    if [[ ! -d "${build_path}/dist" ]]; then
        log_error "Build is incomplete (missing dist directory): ${build_name}"
        return 1
    fi

    echo ""
    echo "=============================================="
    echo "  Sport-Scoreboard Rollback"
    echo "=============================================="
    echo ""

    # Show what we're rolling back to
    show_build_info "${build_name}"

    log "Starting rollback to: ${build_name}"

    # Backup current dist if it exists (for recovery if rollback fails)
    if [[ -d "${SCRIPT_DIR}/dist" ]]; then
        local temp_backup="${SCRIPT_DIR}/.dist_rollback_backup"
        log "Creating temporary backup of current dist..."
        rm -rf "${temp_backup}"
        cp -r "${SCRIPT_DIR}/dist" "${temp_backup}"
    fi

    # Replace dist directory
    log "Restoring build artifacts..."
    rm -rf "${SCRIPT_DIR}/dist"
    cp -r "${build_path}/dist" "${SCRIPT_DIR}/"

    # Restart PM2
    log "Restarting PM2 process..."
    if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
        pm2 restart ecosystem.config.cjs
    else
        pm2 start ecosystem.config.cjs
    fi

    # Health check
    if wait_for_health; then
        # Cleanup temp backup
        rm -rf "${SCRIPT_DIR}/.dist_rollback_backup"

        echo ""
        echo "=============================================="
        log_success "Rollback completed successfully!"
        echo "=============================================="
        echo ""
        pm2 list
        echo ""
        log "Application running at: http://localhost:${APP_PORT}"
        return 0
    else
        log_error "Health check failed after rollback"

        # Attempt to restore from temp backup
        if [[ -d "${SCRIPT_DIR}/.dist_rollback_backup" ]]; then
            log_warning "Attempting to restore previous state..."
            rm -rf "${SCRIPT_DIR}/dist"
            mv "${SCRIPT_DIR}/.dist_rollback_backup" "${SCRIPT_DIR}/dist"
            pm2 restart ecosystem.config.cjs
            log_warning "Restored previous state - rollback was unsuccessful"
        fi

        return 1
    fi
}

interactive_rollback() {
    list_builds || return 1

    local builds count
    builds=$(get_available_builds)
    count=$(echo "$builds" | grep -c . 2>/dev/null || echo "0")

    echo "Enter build number (1-${count}) or timestamp, or 'q' to quit:"
    read -r selection

    if [[ "$selection" == "q" ]] || [[ "$selection" == "Q" ]]; then
        echo "Rollback cancelled."
        return 0
    fi

    local target_build

    # Check if selection is a number
    if [[ "$selection" =~ ^[0-9]+$ ]]; then
        if [[ $selection -lt 1 ]] || [[ $selection -gt $count ]]; then
            log_error "Invalid selection: ${selection}"
            return 1
        fi
        target_build=$(echo "$builds" | sed -n "${selection}p")
    else
        # Assume it's a timestamp
        target_build="$selection"
    fi

    if [[ -z "$target_build" ]]; then
        log_error "Could not determine target build"
        return 1
    fi

    echo ""
    echo -e "${YELLOW}You are about to rollback to: ${target_build}${NC}"
    echo "This will replace the current deployment."
    echo ""
    echo "Continue? (y/N)"
    read -r confirm

    if [[ "$confirm" != "y" ]] && [[ "$confirm" != "Y" ]]; then
        echo "Rollback cancelled."
        return 0
    fi

    perform_rollback "$target_build"
}

# -----------------------------------------------------------------------------
# Entry Point
# -----------------------------------------------------------------------------
show_usage() {
    echo "Usage: $0 [OPTIONS] [BUILD_TIMESTAMP]"
    echo ""
    echo "Options:"
    echo "  --list, -l       List available builds"
    echo "  --latest         Rollback to most recent backup"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Interactive mode"
    echo "  $0 --list             # Show available builds"
    echo "  $0 --latest           # Rollback to most recent"
    echo "  $0 20260118_143022    # Rollback to specific build"
    echo ""
}

main() {
    mkdir -p "${SCRIPT_DIR}/logs"
    cd "${SCRIPT_DIR}"

    case "${1:-}" in
        --help|-h)
            show_usage
            ;;
        --list|-l)
            list_builds
            ;;
        --latest)
            local latest
            latest=$(get_latest_build)
            if [[ -z "$latest" ]]; then
                log_error "No builds available"
                exit 1
            fi
            perform_rollback "$latest"
            ;;
        "")
            interactive_rollback
            ;;
        *)
            # Assume it's a build timestamp
            perform_rollback "$1"
            ;;
    esac
}

main "$@"
