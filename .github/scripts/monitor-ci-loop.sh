#!/bin/bash

# Continuous CI Monitoring Script
# This script continuously monitors CI runs and analyzes failures
#
# Usage:
#   ./monitor-ci-loop.sh                    # Monitor main branch (default)
#   ./monitor-ci-loop.sh --branch <name>    # Monitor specific branch
#   ./monitor-ci-loop.sh --help             # Show help
#
# Features:
#   - Continuously monitors for new CI runs
#   - Auto-analyzes failures when they occur
#   - Saves failure details for later analysis
#   - Provides actionable insights
#   - Can be used by Claude Code or manually

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Repository info (auto-detect or configure)
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-lmcrean}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-ed-tech-app}"
REPO="${REPO_OWNER}/${REPO_NAME}"

# GitHub API base URL
API_BASE="https://api.github.com"

# Configuration
BRANCH="${1:-main}"
CHECK_INTERVAL=60  # seconds between checks
LAST_CHECKED_RUN=""
ITERATION=1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --branch|-b)
        BRANCH="$2"
        shift 2
        ;;
      --interval|-i)
        CHECK_INTERVAL="$2"
        shift 2
        ;;
      --help|-h)
        show_help
        exit 0
        ;;
      *)
        # If no flag, treat as branch name
        if [[ ! "$1" =~ ^- ]]; then
          BRANCH="$1"
        fi
        shift
        ;;
    esac
  done
}

# Show help
show_help() {
  cat <<EOF
${BLUE}Continuous CI Monitoring Script${NC}

${GREEN}Usage:${NC}
  $0                           # Monitor main branch (default)
  $0 --branch <branch>         # Monitor specific branch
  $0 --interval <seconds>      # Set check interval (default: 60s)
  $0 --help                    # Show this help message

${GREEN}Examples:${NC}
  $0                           # Monitor main branch
  $0 develop                   # Monitor develop branch
  $0 --branch feature/new      # Monitor feature branch
  $0 --interval 30             # Check every 30 seconds

${GREEN}Environment Variables:${NC}
  GITHUB_REPOSITORY_OWNER      # Repository owner (default: lmcrean)
  GITHUB_REPOSITORY_NAME       # Repository name (default: ed-tech-app)
  GITHUB_TOKEN                 # GitHub token for authenticated requests

${GREEN}Features:${NC}
  - Continuously monitors for new CI runs
  - Auto-detects and tracks new workflow runs
  - Monitors in-progress runs until completion
  - Analyzes failures and provides detailed logs
  - Saves failure details for later analysis
  - Provides actionable insights and next steps
  - Can be interrupted with Ctrl+C safely

${GREEN}Output Files:${NC}
  When failures occur, details are saved to:
  - /tmp/ci_failure_<run_id>.json        # Failure summary
  - /tmp/workflow_result_<run_id>.json   # Full workflow results
  - /tmp/failed_jobs_<run_id>.json       # Failed job details

${GREEN}Use with Claude Code:${NC}
  Claude Code can run this script to continuously monitor CI,
  analyze failures, and suggest fixes automatically.

EOF
}

# Banner
show_banner() {
  echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║      Continuous CI Monitoring - ${BRANCH} Branch${NC}$(printf '%*s' $((26 - ${#BRANCH})) '')║"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}📊 Repository: ${REPO}${NC}"
  echo -e "${YELLOW}🌿 Branch: ${BRANCH}${NC}"
  echo -e "${YELLOW}⏱️  Check Interval: ${CHECK_INTERVAL}s${NC}"
  echo -e "${YELLOW}🔄 Press Ctrl+C to stop${NC}"
  echo ""
}

# Get latest run for branch
get_latest_run() {
  local branch=$1
  local auth_header=""

  if [ -n "$GITHUB_TOKEN" ]; then
    auth_header="-H \"Authorization: Bearer $GITHUB_TOKEN\""
  fi

  eval "curl -s ${auth_header} '${API_BASE}/repos/${REPO}/actions/runs?branch=${branch}&per_page=1'"
}

# Check for new runs and monitor them
monitor_loop() {
  while true; do
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🔍 Monitoring Cycle: ${ITERATION}${NC}"
    echo -e "${BLUE}⏰ Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

    # Get latest run for branch
    echo -e "${YELLOW}Fetching latest CI run for ${BRANCH} branch...${NC}"

    RESPONSE=$(get_latest_run "$BRANCH")

    # Parse response
    if command -v jq &> /dev/null; then
      RUN_ID=$(echo "$RESPONSE" | jq -r '.workflow_runs[0].id // empty')
      STATUS=$(echo "$RESPONSE" | jq -r '.workflow_runs[0].status // empty')
      CONCLUSION=$(echo "$RESPONSE" | jq -r '.workflow_runs[0].conclusion // "null"')
      WORKFLOW_NAME=$(echo "$RESPONSE" | jq -r '.workflow_runs[0].name // empty')
      HTML_URL=$(echo "$RESPONSE" | jq -r '.workflow_runs[0].html_url // empty')
      CREATED_AT=$(echo "$RESPONSE" | jq -r '.workflow_runs[0].created_at // empty')
    else
      RUN_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0]['id'] if data.get('workflow_runs') else '')")
      STATUS=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0]['status'] if data.get('workflow_runs') else '')")
      CONCLUSION=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0].get('conclusion', 'null') if data.get('workflow_runs') else '')")
      WORKFLOW_NAME=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0]['name'] if data.get('workflow_runs') else '')")
      HTML_URL=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0]['html_url'] if data.get('workflow_runs') else '')")
      CREATED_AT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['workflow_runs'][0]['created_at'] if data.get('workflow_runs') else '')")
    fi

    if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
      echo -e "${RED}❌ No workflow runs found for ${BRANCH} branch${NC}"
      echo -e "${YELLOW}💡 Tip: Push a commit to trigger a new CI run${NC}"
      sleep "$CHECK_INTERVAL"
      ITERATION=$((ITERATION + 1))
      continue
    fi

    # Check if this is a new run
    if [ "$RUN_ID" != "$LAST_CHECKED_RUN" ]; then
      echo -e "${GREEN}🆕 New CI run detected!${NC}"
      echo -e "${CYAN}   ID: ${RUN_ID}${NC}"
      echo -e "${CYAN}   Workflow: ${WORKFLOW_NAME}${NC}"
      echo -e "${CYAN}   Status: ${STATUS}${NC}"
      echo -e "${CYAN}   Created: ${CREATED_AT}${NC}"
      echo -e "${CYAN}   URL: ${HTML_URL}${NC}"
      echo ""

      LAST_CHECKED_RUN="$RUN_ID"

      # Monitor based on status
      if [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "queued" ]; then
        echo -e "${YELLOW}⏳ Workflow is ${STATUS}, monitoring until completion...${NC}"
        echo ""

        # Use the monitor-ci.sh script to track this run
        "$SCRIPT_DIR/monitor-ci.sh" "$RUN_ID" || {
          EXIT_CODE=$?

          if [ $EXIT_CODE -eq 1 ]; then
            # Failure detected
            echo ""
            echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
            echo -e "${RED}║              ❌ CI FAILURE DETECTED ❌                 ║${NC}"
            echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
            echo ""
            echo -e "${MAGENTA}📋 Failure Summary:${NC}"
            echo -e "   ${RED}✗${NC} Run ID: ${RUN_ID}"
            echo -e "   ${RED}✗${NC} Workflow: ${WORKFLOW_NAME}"
            echo -e "   ${RED}✗${NC} Branch: ${BRANCH}"
            echo -e "   ${RED}✗${NC} URL: ${HTML_URL}"
            echo ""

            # Save failure details
            echo "$RESPONSE" > "/tmp/ci_failure_${RUN_ID}.json"
            echo -e "${GREEN}📁 Failure details saved to: /tmp/ci_failure_${RUN_ID}.json${NC}"
            echo ""

            echo -e "${YELLOW}💡 Next Steps:${NC}"
            echo -e "   1. ${CYAN}Review the detailed logs above${NC}"
            echo -e "   2. ${CYAN}Check the full workflow logs at: ${HTML_URL}${NC}"
            echo -e "   3. ${CYAN}Check saved files in /tmp/ for detailed analysis${NC}"
            echo -e "   4. ${CYAN}Fix the identified issues in your code${NC}"
            echo -e "   5. ${CYAN}Commit and push changes to trigger a new run${NC}"
            echo -e "   6. ${CYAN}Monitor will continue watching for the next run${NC}"
            echo ""
          fi
        }
      elif [ "$STATUS" = "completed" ]; then
        echo -e "${BLUE}✓ Workflow already completed${NC}"
        echo ""

        if [ "$CONCLUSION" = "success" ]; then
          echo -e "${GREEN}✅ Status: SUCCESS${NC}"
          echo -e "${GREEN}🎉 All checks passed!${NC}"
        elif [ "$CONCLUSION" = "failure" ]; then
          echo -e "${RED}❌ Status: FAILURE${NC}"
          echo -e "${YELLOW}🔍 Analyzing failure...${NC}"
          echo ""

          # Analyze the failure using monitor-ci.sh
          "$SCRIPT_DIR/monitor-ci.sh" "$RUN_ID" || true

          # Save failure details
          echo "$RESPONSE" > "/tmp/ci_failure_${RUN_ID}.json"
          echo -e "${GREEN}📁 Failure details saved to: /tmp/ci_failure_${RUN_ID}.json${NC}"
        elif [ "$CONCLUSION" = "cancelled" ]; then
          echo -e "${YELLOW}🚫 Status: CANCELLED${NC}"
        else
          echo -e "${YELLOW}⚠️  Status: ${CONCLUSION}${NC}"
        fi
      else
        echo -e "${YELLOW}⚠️  Unknown status: ${STATUS}${NC}"
      fi
    else
      # Same run as before
      echo -e "${BLUE}✓ Monitoring same run (${RUN_ID})${NC}"
      echo -e "   Status: ${STATUS}"
      if [ "$CONCLUSION" != "null" ] && [ -n "$CONCLUSION" ]; then
        echo -e "   Conclusion: ${CONCLUSION}"
      fi
    fi

    # Wait before next check
    echo ""
    echo -e "${YELLOW}⏳ Waiting ${CHECK_INTERVAL} seconds before next check...${NC}"
    sleep "$CHECK_INTERVAL"

    ITERATION=$((ITERATION + 1))
  done
}

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Monitoring stopped by user${NC}"
  echo -e "${GREEN}✓ Total monitoring cycles: ${ITERATION}${NC}"
  echo ""
  exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Main
main() {
  parse_args "$@"
  show_banner
  monitor_loop
}

# Run
main "$@"
