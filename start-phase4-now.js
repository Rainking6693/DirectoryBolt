#!/usr/bin/env node

/**
 * DirectoryBolt Phase 4 Deployment Starter
 * Starts Emily's Phase 4 agents and monitoring system
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DirectoryBolt Phase 4 Agent Deployment');
console.log('========================================');
console.log('');

// Check prerequisites
console.log('✅ Node.js available');

if (!fs.existsSync('EMILY_PHASE_4_TASKS.md')) {
    console.log('❌ Task file EMILY_PHASE_4_TASKS.md not found');
    process.exit(1);
}

console.log('✅ Task file found');
console.log('✅ Prerequisites check passed');
console.log('');

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
    console.log('✅ Created logs directory');
}

// Start task completion monitor
console.log('📋 Starting Task Completion Monitor...');
const monitor = spawn('node', ['scripts/task-completion-monitor.js', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
});

// Start agent deployment system  
console.log('🤖 Starting Agent Deployment System...');
const agents = spawn('node', ['scripts/deploy-phase4-agents.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
});

// Save PIDs
fs.writeFileSync('logs/monitor.pid', monitor.pid.toString());
fs.writeFileSync('logs/agents.pid', agents.pid.toString());

console.log(`   Task Monitor PID: ${monitor.pid}`);
console.log(`   Agent System PID: ${agents.pid}`);
console.log('');

// Set up log file streams
const monitorLog = fs.createWriteStream('logs/task-monitor.log', { flags: 'a' });
const agentLog = fs.createWriteStream('logs/agent-deployment.log', { flags: 'a' });

// Pipe outputs to log files and console
monitor.stdout.on('data', (data) => {
    const output = data.toString();
    monitorLog.write(output);
    if (output.includes('✅') || output.includes('📊') || output.includes('🎉')) {
        console.log(`[MONITOR] ${output.trim()}`);
    }
});

monitor.stderr.on('data', (data) => {
    const output = data.toString();
    monitorLog.write(`ERROR: ${output}`);
    console.error(`[MONITOR ERROR] ${output.trim()}`);
});

agents.stdout.on('data', (data) => {
    const output = data.toString();
    agentLog.write(output);
    if (output.includes('✅') || output.includes('🤖') || output.includes('🎯')) {
        console.log(`[AGENTS] ${output.trim()}`);
    }
});

agents.stderr.on('data', (data) => {
    const output = data.toString();
    agentLog.write(`ERROR: ${output}`);
    console.error(`[AGENTS ERROR] ${output.trim()}`);
});

console.log('🎯 Phase 4 deployment started successfully!');
console.log('');
console.log('📊 Monitoring Status:');
console.log(`   Task Monitor: Running (PID: ${monitor.pid})`);
console.log(`   Agent System: Running (PID: ${agents.pid})`);
console.log('');
console.log('📋 Commands:');
console.log('   View task progress:  tail -f logs/task-monitor.log');
console.log('   View agent status:   tail -f logs/agent-deployment.log');
console.log('   Check progress:      node scripts/task-completion-monitor.js progress');
console.log('');
console.log('⏰ Agents will check in every 10 minutes');
console.log('📝 Task completions will be automatically tracked');
console.log('');
console.log('🎉 Emily, your Phase 4 agents are now working!');
console.log('   Check the logs above to monitor progress');
console.log('   Tasks will be automatically checked off as completed');
console.log('');

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down Phase 4 deployment...');
    
    try {
        monitor.kill();
        agents.kill();
        console.log('✅ All agents stopped');
    } catch (error) {
        console.log('⚠️  Some processes may still be running');
    }
    
    process.exit(0);
});

// Keep the process alive
process.stdin.resume();