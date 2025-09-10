#!/bin/bash

# DirectoryBolt Phase 4 Agent Deployment Stop Script
# Stops all agents and monitoring systems

echo "🛑 Stopping DirectoryBolt Phase 4 Agent Deployment"
echo "================================================="
echo ""

# Function to stop process by PID file
stop_process() {
    local pid_file=$1
    local process_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "🛑 Stopping $process_name (PID: $pid)..."
            kill $pid
            sleep 2
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo "   Force stopping $process_name..."
                kill -9 $pid
            fi
            
            echo "✅ $process_name stopped"
        else
            echo "⚠️  $process_name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "⚠️  No PID file found for $process_name"
    fi
}

# Stop task monitor
stop_process "logs/monitor.pid" "Task Monitor"

# Stop agent system
stop_process "logs/agents.pid" "Agent System"

# Generate final report
echo ""
echo "📊 Generating final progress report..."

if command -v node &> /dev/null && [ -f "scripts/task-completion-monitor.js" ]; then
    node scripts/task-completion-monitor.js progress
else
    echo "⚠️  Cannot generate progress report"
fi

echo ""
echo "📄 Log files preserved in logs/ directory:"
echo "   - logs/task-monitor.log"
echo "   - logs/agent-deployment.log"
echo ""
echo "✅ Phase 4 deployment stopped successfully"
echo ""
echo "🎯 Next steps:"
echo "   1. Review completion status in EMILY_PHASE_4_TASKS.md"
echo "   2. Check logs for any issues or blockers"
echo "   3. Continue with remaining manual tasks if needed"
echo "   4. Deploy completed features to staging environment"