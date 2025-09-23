-- Emergency Monitoring Tables for AutoBolt
-- These tables support real-time monitoring and debugging capabilities

-- Activity logging table for real-time monitoring
CREATE TABLE IF NOT EXISTS autobolt_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    directory VARCHAR(255),
    customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    details TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API response logging for performance monitoring
CREATE TABLE IF NOT EXISTS autobolt_api_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    duration_ms INTEGER,
    error_message TEXT,
    request_body JSONB,
    response_body JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logging for debugging
CREATE TABLE IF NOT EXISTS autobolt_error_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}',
    severity VARCHAR(50) DEFAULT 'error',
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extension status tracking
CREATE TABLE IF NOT EXISTS autobolt_extension_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extension_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'unknown',
    version VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active browser tabs tracking
CREATE TABLE IF NOT EXISTS autobolt_active_tabs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tab_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    url VARCHAR(1000),
    processing_status VARCHAR(50) DEFAULT 'idle',
    is_active BOOLEAN DEFAULT TRUE,
    customer_id VARCHAR(255),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenshot metadata storage
CREATE TABLE IF NOT EXISTS autobolt_screenshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tab_url VARCHAR(1000),
    tab_title VARCHAR(500),
    screenshot_url VARCHAR(1000), -- URL to stored screenshot
    screenshot_size INTEGER,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration for monitoring modes
CREATE TABLE IF NOT EXISTS autobolt_system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Command queue for extension communication
CREATE TABLE IF NOT EXISTS autobolt_commands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    command VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'normal',
    result JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts for critical issues
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_autobolt_activity_log_created_at ON autobolt_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autobolt_activity_log_customer_id ON autobolt_activity_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_activity_log_status ON autobolt_activity_log(status);

CREATE INDEX IF NOT EXISTS idx_autobolt_api_log_created_at ON autobolt_api_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autobolt_api_log_endpoint ON autobolt_api_log(endpoint);

CREATE INDEX IF NOT EXISTS idx_autobolt_error_log_created_at ON autobolt_error_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_autobolt_error_log_severity ON autobolt_error_log(severity);

CREATE INDEX IF NOT EXISTS idx_autobolt_extension_status_extension_id ON autobolt_extension_status(extension_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_extension_status_last_seen ON autobolt_extension_status(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_autobolt_active_tabs_is_active ON autobolt_active_tabs(is_active);
CREATE INDEX IF NOT EXISTS idx_autobolt_active_tabs_customer_id ON autobolt_active_tabs(customer_id);

CREATE INDEX IF NOT EXISTS idx_autobolt_screenshots_captured_at ON autobolt_screenshots(captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_autobolt_system_config_key ON autobolt_system_config(key);

CREATE INDEX IF NOT EXISTS idx_autobolt_commands_status ON autobolt_commands(status);
CREATE INDEX IF NOT EXISTS idx_autobolt_commands_created_at ON autobolt_commands(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- Insert default system configurations
INSERT INTO autobolt_system_config (key, value) VALUES 
    ('debug_mode', '{"enabled": false}'),
    ('watch_mode', '{"enabled": false}'),
    ('emergency_stop', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;

-- Create function to clean old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_autobolt_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM autobolt_activity_log WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM autobolt_api_log WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM autobolt_error_log WHERE created_at < NOW() - INTERVAL '30 days' AND resolved = true;
    DELETE FROM autobolt_screenshots WHERE created_at < NOW() - INTERVAL '7 days';
    DELETE FROM autobolt_commands WHERE status IN ('completed', 'failed') AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('autobolt-cleanup', '0 2 * * *', 'SELECT cleanup_autobolt_logs();');

COMMENT ON TABLE autobolt_activity_log IS 'Real-time activity logging for AutoBolt operations';
COMMENT ON TABLE autobolt_api_log IS 'API request/response logging for performance monitoring';
COMMENT ON TABLE autobolt_error_log IS 'Error tracking and debugging information';
COMMENT ON TABLE autobolt_extension_status IS 'Chrome extension status and heartbeat tracking';
COMMENT ON TABLE autobolt_active_tabs IS 'Active browser tabs being processed by AutoBolt';
COMMENT ON TABLE autobolt_screenshots IS 'Screenshot metadata for visual monitoring';
COMMENT ON TABLE autobolt_system_config IS 'System configuration for monitoring modes';
COMMENT ON TABLE autobolt_commands IS 'Command queue for extension communication';
COMMENT ON TABLE system_alerts IS 'System-wide alerts and notifications';