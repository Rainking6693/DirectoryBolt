-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id character varying,
  event_type character varying NOT NULL,
  event_name character varying NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.batch_operations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  operation_type character varying NOT NULL CHECK (operation_type::text = ANY (ARRAY['process'::character varying, 'retry'::character varying, 'cancel'::character varying, 'pause'::character varying, 'resume'::character varying]::text[])),
  customer_ids jsonb NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying]::text[])),
  total_customers integer NOT NULL,
  processed_customers integer DEFAULT 0,
  successful_operations integer DEFAULT 0,
  failed_operations integer DEFAULT 0,
  error_message text,
  created_by character varying,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT batch_operations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customer_notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id character varying,
  notification_type character varying NOT NULL CHECK (notification_type::text = ANY (ARRAY['success'::character varying, 'warning'::character varying, 'info'::character varying, 'error'::character varying]::text[])),
  title character varying NOT NULL,
  message text NOT NULL,
  action_url character varying,
  action_text character varying,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT customer_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.customers (
  id text NOT NULL,
  customer_id character varying NOT NULL UNIQUE,
  business_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  website character varying,
  address text,
  city character varying,
  state character varying,
  zip character varying,
  country character varying DEFAULT 'USA'::character varying,
  package_type character varying DEFAULT 'starter'::character varying CHECK (package_type::text = ANY (ARRAY['starter'::character varying, 'growth'::character varying, 'professional'::character varying, 'pro'::character varying, 'enterprise'::character varying]::text[])),
  directory_limit integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  category text,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.directories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  website character varying NOT NULL UNIQUE,
  category character varying NOT NULL,
  domain_authority integer DEFAULT 50 CHECK (domain_authority >= 0 AND domain_authority <= 100),
  impact_level character varying DEFAULT 'Medium'::character varying CHECK (impact_level::text = ANY (ARRAY['Low'::character varying, 'Medium'::character varying, 'High'::character varying]::text[])),
  submission_url character varying,
  tier_required integer DEFAULT 3 CHECK (tier_required = ANY (ARRAY[1, 2, 3, 4])),
  difficulty character varying DEFAULT 'Medium'::character varying CHECK (difficulty::text = ANY (ARRAY['Easy'::character varying, 'Medium'::character varying, 'Hard'::character varying]::text[])),
  active boolean NOT NULL DEFAULT true,
  estimated_traffic integer DEFAULT 0,
  time_to_approval character varying DEFAULT '1-3 days'::character varying,
  price integer DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  requires_approval boolean DEFAULT true,
  country_code character varying,
  language character varying DEFAULT 'en'::character varying,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  field_selectors jsonb DEFAULT '{}'::jsonb,
  selectors_updated_at timestamp with time zone,
  selector_discovery_log jsonb DEFAULT '{}'::jsonb,
  requires_login boolean DEFAULT false,
  has_captcha boolean DEFAULT false,
  failure_rate numeric DEFAULT 0.00,
  CONSTRAINT directories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.directory_form_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  directory_url text NOT NULL UNIQUE,
  field_mappings jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT directory_form_mappings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.directory_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  directory_id text NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  pacing_min_ms integer,
  pacing_max_ms integer,
  max_retries integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT directory_overrides_pkey PRIMARY KEY (id)
);
CREATE TABLE public.directory_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_job_id text,
  directory_url text NOT NULL,
  status text DEFAULT 'pending'::text,
  result_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  listing_data jsonb,
  submission_queue_id uuid,
  customer_id text,
  CONSTRAINT directory_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT fk_directory_submissions_customer FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id),
  CONSTRAINT directory_submissions_customer_job_id_fkey FOREIGN KEY (customer_job_id) REFERENCES public.jobs(customer_id),
  CONSTRAINT fk_dirsubs_job FOREIGN KEY (submission_queue_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  directory_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'submitted'::text, 'failed'::text, 'retry'::text])),
  response_log jsonb DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone,
  retry_count integer DEFAULT 0,
  CONSTRAINT job_results_pkey PRIMARY KEY (id),
  CONSTRAINT job_results_migrated_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.job_results_count (
  count bigint
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id text NOT NULL UNIQUE,
  package_size integer NOT NULL CHECK (package_size = ANY (ARRAY[50, 100, 300, 500])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'complete'::text, 'failed'::text])),
  priority_level integer DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  business_name text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  zip text,
  description text,
  category text,
  directory_limit integer NOT NULL DEFAULT 50,
  package_type text NOT NULL DEFAULT 'starter'::text,
  business_email text,
  business_phone text,
  business_address text,
  business_city text,
  business_state text,
  business_zip text,
  business_website text,
  business_description text,
  business_category text,
  customer_uuid uuid,
  business_data jsonb,
  customer_name character varying,
  customer_email character varying,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.legacy_submissions_count (
  count bigint
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id character varying,
  stripe_payment_intent_id character varying,
  amount integer,
  currency character varying DEFAULT 'usd'::character varying,
  status character varying,
  package_type character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.queue_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id character varying,
  status_from character varying,
  status_to character varying NOT NULL,
  directories_processed integer DEFAULT 0,
  directories_failed integer DEFAULT 0,
  processing_time_seconds integer,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT queue_history_pkey PRIMARY KEY (id),
  CONSTRAINT queue_history_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id)
);
CREATE TABLE public.system_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flag_key character varying NOT NULL UNIQUE,
  flag_value jsonb,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_flags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.two_factor_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid,
  customer_id character varying,
  directory_name character varying,
  request_type character varying,
  status character varying DEFAULT 'pending'::character varying,
  details jsonb,
  assigned_to character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT two_factor_requests_pkey PRIMARY KEY (id),
  CONSTRAINT two_factor_requests_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type character varying,
  provider character varying,
  payload jsonb,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.worker_heartbeats (
  worker_id text NOT NULL,
  status text NOT NULL,
  last_seen timestamp with time zone NOT NULL,
  ai_services_enabled boolean DEFAULT false,
  jobs_processed integer DEFAULT 0,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT worker_heartbeats_pkey PRIMARY KEY (worker_id)
);
CREATE TABLE public.worker_status (
  worker_id text NOT NULL,
  last_heartbeat timestamp with time zone NOT NULL,
  status text,
  desired_state text DEFAULT 'running'::text,
  CONSTRAINT worker_status_pkey PRIMARY KEY (worker_id)
);