# Jobs Table Schema

| Column           | Type     | Nullable | Default    | Description |
|------------------|----------|----------|------------|-------------|
| id               | uuid     | no       | generated  | Primary key |
| customer_id      | text     | no       |            | External customer identifier |
| business_name    | text     | yes      |            | Customer business name |
| email            | text     | yes      |            | Contact email for job |
| phone            | text     | yes      |            | Contact phone |
| website          | text     | yes      |            | Business website URL |
| address          | text     | yes      |            | Street address |
| city             | text     | yes      |            | City |
| state            | text     | yes      |            | State/region |
| zip              | text     | yes      |            | Postal code |
| description      | text     | yes      |            | Business description |
| category         | text     | yes      |            | Business category |
| package_type     | text     | no       | 'starter'  | Package tier requested |
| directory_limit  | integer  | no       | 50         | Maximum directories to process |
| package_size     | integer  | yes      |            | Legacy size metric (maintained) |
| priority_level   | integer  | yes      |            | Priority ordering |
| status           | text     | no       | 'pending'  | Job status (pending/in_progress/complete/failed) |
| metadata         | jsonb    | yes      |            | Additional worker metadata |
| created_at       | timestamp| no       | now()      | Creation timestamp |
| updated_at       | timestamp| no       | now()      | Last update timestamp |
| started_at       | timestamp| yes      |            | Worker start time |
| completed_at     | timestamp| yes      |            | Worker completion time |
| error_message    | text     | yes      |            | Last error message |

Refer to `supabase/migrations/20251007_add_business_fields_to_jobs.sql` for the authoritative migration script.
