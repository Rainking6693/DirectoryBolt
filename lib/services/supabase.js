const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
      }

      this.client = createClient(supabaseUrl, supabaseServiceKey);
      this.initialized = true;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase service:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      // Test connection by querying customers table
      const { data, error } = await this.client
        .from('customers')
        .select('customer_id')
        .limit(1);

      if (error) {
        return {
          ok: false,
          error: error.message
        };
      }

      return {
        ok: true,
        message: 'Supabase connection successful',
        hasData: data && data.length > 0
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message
      };
    }
  }

  async getCustomerById(customerId) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      // First try direct customer_id lookup (most common case)
      let { data, error } = await this.client
        .from('customers')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      // If not found, try uppercase version
      if (error && error.code === 'PGRST116') {
        const { data: upperData, error: upperError } = await this.client
          .from('customers')
          .select('*')
          .eq('customer_id', customerId.toUpperCase())
          .single();
        
        data = upperData;
        error = upperError;
      }

      // If still not found, try metadata searches for migrated customers
      if (error && error.code === 'PGRST116') {
        const { data: metaData, error: metaError } = await this.client
          .from('customers')
          .select('*')
          .or(`metadata->>original_customer_id.eq.${customerId},business_data->>original_customer_id.eq.${customerId}`)
          .single();
        
        data = metaData;
        error = metaError;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          return { found: false, error: 'Customer not found' };
        }
        return { found: false, error: error.message };
      }

      // Handle new customers table schema (from migration)
      const businessData = data.business_data || {};
      const metadata = data.metadata || {};
      
      // Extract name components
      const fullName = data.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        found: true,
        customer: {
          customerId: businessData.original_customer_id || metadata.original_customer_id || data.customer_id || customerId,
          firstName: firstName || data.first_name || '',
          lastName: lastName || data.last_name || '',
          businessName: data.company_name || data.business_name || '',
          email: data.email || '',
          phone: businessData.phone || data.phone || '',
          website: businessData.website || data.website || '',
          address: businessData.address || data.address || '',
          city: businessData.city || data.city || '',
          state: businessData.state || data.state || '',
          zip: businessData.zip || data.zip || '',
          packageType: businessData.original_package_type || this.mapTierToPackage(data.subscription_tier) || data.package_type || 'starter',
          status: this.mapSupabaseStatus(data.subscription_status) || data.status || 'active',
          created: data.created_at || ''
        }
      };
    } catch (error) {
      return {
        found: false,
        error: error.message
      };
    }
  }

  async addCustomer(customerData) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const { data, error } = await this.client
        .from('customers')
        .insert([{
          customer_id: customerData.customerId,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          business_name: customerData.businessName,
          email: customerData.email,
          phone: customerData.phone || '',
          website: customerData.website || '',
          address: customerData.address || '',
          city: customerData.city || '',
          state: customerData.state || '',
          zip: customerData.zip || '',
          package_type: customerData.packageType || 'starter',
          status: customerData.status || 'active'
        }])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        customerId: data.customer_id,
        updatedRows: 1
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllCustomers(limit = 100) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const { data, error } = await this.client
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: error.message,
          customers: [],
          total: 0
        };
      }

      const customers = data.map(record => ({
        customerId: record.customer_id,
        firstName: record.first_name || '',
        lastName: record.last_name || '',
        businessName: record.business_name || '',
        email: record.email || '',
        phone: record.phone || '',
        website: record.website || '',
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        zip: record.zip || '',
        packageType: record.package_type || 'starter',
        status: record.status || 'active',
        created: record.created_at || ''
      }));

      return {
        success: true,
        customers,
        total: customers.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        customers: [],
        total: 0
      };
    }
  }

  async updateCustomer(customerId, updateData) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      // Map fields to database column names
      const updateFields = {};
      const fieldMapping = {
        firstName: 'first_name',
        lastName: 'last_name',
        businessName: 'business_name',
        email: 'email',
        phone: 'phone',
        website: 'website',
        address: 'address',
        city: 'city',
        state: 'state',
        zip: 'zip',
        packageType: 'package_type',
        status: 'status'
      };

      Object.entries(updateData).forEach(([key, value]) => {
        const dbField = fieldMapping[key] || key.toLowerCase();
        updateFields[dbField] = value;
      });

      const { data, error } = await this.client
        .from('customers')
        .update(updateFields)
        .eq('customer_id', customerId.toUpperCase())
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        updatedFields: Object.keys(updateData),
        customerId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getPackageLimits() {
    return {
      starter: 50,
      growth: 75,
      professional: 150,
      enterprise: 500
    };
  }

  validateCustomerId(customerId) {
    const pattern = /^DIR-\d{8}-\d{6}$/;
    return pattern.test(customerId);
  }

  generateCustomerId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `DIR-${year}${month}${day}-${random}`;
  }

  // Helper functions for mapping between old and new schemas
  mapTierToPackage(tier) {
    const tierToPackageMap = {
      'basic': 'starter',
      'pro': 'professional',
      'enterprise': 'enterprise'
    };
    return tierToPackageMap[tier] || 'starter';
  }

  mapSupabaseStatus(status) {
    const statusMap = {
      'active': 'active',
      'trialing': 'pending',
      'past_due': 'past_due',
      'cancelled': 'cancelled',
      'unpaid': 'unpaid'
    };
    return statusMap[status] || 'pending';
  }

  // Alias methods for compatibility with existing code
  async findByCustomerId(customerId) {
    const result = await this.getCustomerById(customerId);
    return result.found ? result.customer : null;
  }

  async createBusinessSubmission(customerData) {
    // Generate customer ID if not provided
    if (!customerData.customerId) {
      customerData.customerId = this.generateCustomerId();
    }

    const result = await this.addCustomer(customerData);
    if (result.success) {
      return {
        ...customerData,
        customerId: result.customerId
      };
    } else {
      throw new Error(result.error);
    }
  }

  // Additional methods needed by queue-manager
  async healthCheck() {
    try {
      const result = await this.testConnection();
      return result.ok;
    } catch (error) {
      return false;
    }
  }

  async findByStatus(status) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const { data, error } = await this.client
        .from('customers')
        .select('*')
        .eq('status', status.toLowerCase())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error finding customers by status:', error);
        return [];
      }

      return data.map(record => ({
        recordId: record.id,
        customerId: record.customer_id,
        firstName: record.first_name || '',
        lastName: record.last_name || '',
        businessName: record.business_name || '',
        email: record.email || '',
        phone: record.phone || '',
        website: record.website || '',
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        zip: record.zip || '',
        packageType: record.package_type || 'starter',
        status: record.status || 'active',
        submissionStatus: record.status || 'active',
        purchaseDate: record.created_at || new Date().toISOString(),
        created: record.created_at || ''
      }));
    } catch (error) {
      console.error('Error finding customers by status:', error);
      return [];
    }
  }

  async updateSubmissionStatus(customerId, status, directoriesSubmitted = null, failedDirectories = null) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const updateData = { status: status.toLowerCase() };
      
      // Add additional fields if provided
      if (directoriesSubmitted !== null) {
        updateData.directories_submitted = directoriesSubmitted;
      }
      if (failedDirectories !== null) {
        updateData.failed_directories = failedDirectories;
      }

      const { data, error } = await this.client
        .from('customers')
        .update(updateData)
        .eq('customer_id', customerId.toUpperCase())
        .select()
        .single();

      if (error) {
        console.error('Error updating submission status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating submission status:', error);
      return false;
    }
  }

  // Real-time subscription methods
  subscribeToCustomers(callback) {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    return this.client
      .channel('customers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers'
      }, callback)
      .subscribe();
  }

  unsubscribe(subscription) {
    if (subscription) {
      this.client.removeChannel(subscription);
    }
  }
}

// Factory function to create and return a SupabaseService instance
function createSupabaseService() {
  return new SupabaseService();
}

// Export both the class and the factory function
module.exports = {
  SupabaseService,
  createSupabaseService,
  default: SupabaseService
};

// For compatibility with different import styles
module.exports.SupabaseService = SupabaseService;
module.exports.createSupabaseService = createSupabaseService;
module.exports.default = SupabaseService;