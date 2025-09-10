#!/bin/bash

# DirectoryBolt Phase 4 Agent Deployment Script
# Starts all agents and monitoring systems for Phase 4 implementation

echo "🚀 DirectoryBolt Phase 4 Agent Deployment"
echo "========================================"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check if task file exists
if [ ! -f "EMILY_PHASE_4_TASKS.md" ]; then
    echo "❌ Task file EMILY_PHASE_4_TASKS.md not found"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Create logs directory
mkdir -p logs

# Start task completion monitor in background
echo "📋 Starting Task Completion Monitor..."
node scripts/task-completion-monitor.js start > logs/task-monitor.log 2>&1 &
MONITOR_PID=$!
echo "   PID: $MONITOR_PID"
echo "   Log: logs/task-monitor.log"

# Start agent deployment system
echo "🤖 Starting Agent Deployment System..."
node scripts/deploy-phase4-agents.js > logs/agent-deployment.log 2>&1 &
AGENT_PID=$!
echo "   PID: $AGENT_PID"
echo "   Log: logs/agent-deployment.log"

# Create PID file for easy management
echo "$MONITOR_PID" > logs/monitor.pid
echo "$AGENT_PID" > logs/agents.pid

echo ""
echo "🎯 Phase 4 deployment started successfully!"
echo ""
echo "📊 Monitoring Status:"
echo "   Task Monitor: Running (PID: $MONITOR_PID)"
echo "   Agent System: Running (PID: $AGENT_PID)"
echo ""
echo "📋 Commands:"
echo "   View task progress:  tail -f logs/task-monitor.log"
echo "   View agent status:   tail -f logs/agent-deployment.log"
echo "   Stop deployment:     ./scripts/stop-phase4-deployment.sh"
echo "   Check progress:      node scripts/task-completion-monitor.js progress"
echo ""
echo "⏰ Agents will check in every 10 minutes"
echo "📝 Task completions will be automatically tracked"
echo ""
echo "🎉 Emily, your Phase 4 agents are now working!"
echo "   Check the logs above to monitor progress"
echo "   Tasks will be automatically checked off as completed"