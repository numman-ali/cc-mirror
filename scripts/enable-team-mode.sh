#!/bin/bash
# enable-team-mode.sh
# Patches a claude-sneakpeek variant to enable team mode features

set -e

VARIANT_NAME="${1:-team-mode}"
CC_MIRROR_ROOT="$HOME/.claude-sneakpeek"
VARIANT_DIR="$CC_MIRROR_ROOT/$VARIANT_NAME"
CLI_PATH="$VARIANT_DIR/npm/node_modules/@anthropic-ai/claude-code/cli.js"
SETTINGS_PATH="$VARIANT_DIR/config/settings.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Team Mode Enabler for claude-sneakpeek${NC}"
echo "=================================="
echo ""

# Check if variant exists
if [ ! -d "$VARIANT_DIR" ]; then
    echo -e "${RED}Error: Variant '$VARIANT_NAME' not found at $VARIANT_DIR${NC}"
    echo ""
    echo "Available variants:"
    ls -1 "$CC_MIRROR_ROOT" 2>/dev/null | grep -v "^$" || echo "  (none)"
    echo ""
    echo "Create a variant first with:"
    echo "  npm run dev -- create --provider <provider> --name $VARIANT_NAME"
    exit 1
fi

# Check if CLI exists
if [ ! -f "$CLI_PATH" ]; then
    echo -e "${RED}Error: cli.js not found at $CLI_PATH${NC}"
    echo "The variant may not have Claude Code installed correctly."
    exit 1
fi

# Backup CLI if not already backed up
BACKUP_PATH="${CLI_PATH}.backup"
if [ ! -f "$BACKUP_PATH" ]; then
    echo "Creating backup of cli.js..."
    cp "$CLI_PATH" "$BACKUP_PATH"
    echo -e "${GREEN}Backup created at ${BACKUP_PATH}${NC}"
else
    echo "Backup already exists, skipping..."
fi

# Check current state
if grep -q "function sU(){return!0}" "$CLI_PATH"; then
    echo -e "${GREEN}Team mode is already enabled!${NC}"
else
    echo "Patching cli.js to enable team mode..."

    # Patch: change sU() to return true
    if sed -i '' 's/function sU(){return!1}/function sU(){return!0}/' "$CLI_PATH" 2>/dev/null || \
       sed -i 's/function sU(){return!1}/function sU(){return!0}/' "$CLI_PATH"; then
        echo -e "${GREEN}Patched successfully!${NC}"
    else
        echo -e "${RED}Failed to patch cli.js${NC}"
        exit 1
    fi

    # Verify patch
    if grep -q "function sU(){return!0}" "$CLI_PATH"; then
        echo -e "${GREEN}Verification passed: sU() now returns true${NC}"
    else
        echo -e "${RED}Verification failed: patch may not have applied correctly${NC}"
        exit 1
    fi
fi

# Add team environment variables to settings.json
echo ""
echo "Configuring team environment variables..."

if [ -f "$SETTINGS_PATH" ]; then
    # Check if team vars already exist
    if grep -q "CLAUDE_CODE_TEAM_NAME" "$SETTINGS_PATH"; then
        echo "Team environment variables already configured."
    else
        # Add team env vars to existing settings
        # Using node for reliable JSON manipulation
        node -e "
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('$SETTINGS_PATH', 'utf8'));
settings.env = settings.env || {};
settings.env.CLAUDE_CODE_TEAM_NAME = settings.env.CLAUDE_CODE_TEAM_NAME || '$VARIANT_NAME';
settings.env.CLAUDE_CODE_AGENT_TYPE = settings.env.CLAUDE_CODE_AGENT_TYPE || 'team-lead';
fs.writeFileSync('$SETTINGS_PATH', JSON.stringify(settings, null, 2));
console.log('Added team env vars to settings.json');
"
        echo -e "${GREEN}Team environment variables added to settings.json${NC}"
    fi
else
    echo -e "${YELLOW}Warning: settings.json not found, creating minimal config...${NC}"
    cat > "$SETTINGS_PATH" << EOF
{
  "env": {
    "CLAUDE_CODE_TEAM_NAME": "$VARIANT_NAME",
    "CLAUDE_CODE_AGENT_TYPE": "team-lead"
  }
}
EOF
    echo -e "${GREEN}Created settings.json with team config${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Team mode enabled for variant: $VARIANT_NAME${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Usage:"
echo "  $VARIANT_NAME                    # Start with team mode"
echo ""
echo "Or with custom agent identity:"
echo "  CLAUDE_CODE_AGENT_ID=worker-1 $VARIANT_NAME"
echo ""
echo "Task storage location (isolated per variant):"
echo "  ~/.claude-sneakpeek/$VARIANT_NAME/config/tasks/$VARIANT_NAME/"
echo ""
echo "To restore original CLI:"
echo "  cp '$BACKUP_PATH' '$CLI_PATH'"
echo ""
