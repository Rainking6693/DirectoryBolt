// Simple types for the worker
export interface JobPayload {
  id: string;
  customer_id: string;
  business_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  category?: string;
  directory_limit?: number;
  package_size?: string;
}
