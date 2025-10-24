BEGIN;

-- 1) Add new UUID column for proper FK to customers
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS customer_uuid UUID;

-- 2) Backfill from legacy string code (jobs.customer_id) via customers.customer_id
UPDATE jobs
SET customer_uuid = c.id
FROM customers c
WHERE c.customer_id IS NOT NULL
  AND jobs.customer_id IS NOT NULL
  AND c.customer_id = jobs.customer_id
  AND jobs.customer_uuid IS NULL;

-- 3) Add FK and index
DO $$ BEGIN
  ALTER TABLE jobs
    ADD CONSTRAINT fk_jobs_customer_uuid
    FOREIGN KEY (customer_uuid)
    REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_customer_uuid ON jobs(customer_uuid);

-- 4) Optional: enforce NOT NULL after verifying no NULLs remain
-- ALTER TABLE jobs ALTER COLUMN customer_uuid SET NOT NULL;

COMMIT;
