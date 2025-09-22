-- DirectoryBolt Emergency Database Setup
-- Critical tables required for production deployment

-- =============================================================================
-- STRIPE EVENTS TABLE (CRITICAL FOR PAYMENT PROCESSING)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.stripe_events (
    id BIGSERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created ON public.stripe_events(created_at);

-- RLS Policy for stripe_events
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all stripe events
CREATE POLICY "stripe_events_service_policy" ON public.stripe_events
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- AI ANALYSIS RESULTS TABLE (CRITICAL FOR AI OPERATIONS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_analysis_results (
    id BIGSERIAL PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0,
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', etc.
    model VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_analysis_customer ON public.ai_analysis_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON public.ai_analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created ON public.ai_analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_status ON public.ai_analysis_results(status);

-- RLS Policy for ai_analysis_results
ALTER TABLE public.ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all AI analysis results
CREATE POLICY "ai_analysis_service_policy" ON public.ai_analysis_results
    FOR ALL USING (auth.role() = 'service_role');

-- Allow customers to view only their own results
CREATE POLICY "ai_analysis_customer_policy" ON public.ai_analysis_results
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        customer_id = auth.jwt() ->> 'customer_id'
    );

-- =============================================================================
-- UPDATE FUNCTIONS (FOR AUTOMATIC TIMESTAMPS)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_stripe_events_updated_at 
    BEFORE UPDATE ON public.stripe_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_analysis_updated_at 
    BEFORE UPDATE ON public.ai_analysis_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Test insert and cleanup for stripe_events
INSERT INTO public.stripe_events (stripe_event_id, event_type, data) 
VALUES ('test_event_' || extract(epoch from now()), 'test.event', '{"test": true}');

DELETE FROM public.stripe_events WHERE event_type = 'test.event';

-- Test insert and cleanup for ai_analysis_results
INSERT INTO public.ai_analysis_results (customer_id, analysis_type, provider, output_data) 
VALUES ('test_customer_' || extract(epoch from now()), 'test_analysis', 'openai', '{"test": true}');

DELETE FROM public.ai_analysis_results WHERE analysis_type = 'test_analysis';

-- Final verification
SELECT 'stripe_events table ready' as status;
SELECT 'ai_analysis_results table ready' as status;