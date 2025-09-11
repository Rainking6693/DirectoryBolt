#!/usr/bin/env node

/**
 * QUINN - Secure Credential Generator
 * Generates cryptographically secure credentials for production
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateSecureCredentials() {
    console.log('🔐 QUINN - Generating Cryptographically Secure Credentials');
    console.log('=======================================================');
    
    // Generate secure random values
    const jwtSecret = crypto.randomBytes(32).toString('base64');
    const adminApiKey = crypto.randomBytes(32).toString('hex');
    const adminSessionToken = crypto.randomBytes(32).toString('hex');
    const staffApiKey = crypto.randomBytes(32).toString('hex');
    const staffSessionToken = crypto.randomBytes(32).toString('hex');
    
    // Generate secure usernames
    const adminUsername = `admin_${crypto.randomBytes(4).toString('hex')}`;
    const staffUsername = `staff_${crypto.randomBytes(4).toString('hex')}`;
    
    // Generate secure passwords
    const adminPassword = generateSecurePassword();
    const staffPassword = generateSecurePassword();
    
    // Hash passwords with bcrypt
    const adminPasswordHash = bcrypt.hashSync(adminPassword, 12);
    const staffPasswordHash = bcrypt.hashSync(staffPassword, 12);
    
    console.log('✅ Secure credentials generated!\n');
    
    console.log('📋 PRODUCTION ENVIRONMENT VARIABLES:');
    console.log('====================================');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log(`ADMIN_API_KEY=${adminApiKey}`);
    console.log(`ADMIN_SESSION_TOKEN=${adminSessionToken}`);
    console.log(`ADMIN_USERNAME=${adminUsername}`);
    console.log(`ADMIN_PASSWORD_HASH=${adminPasswordHash}`);
    console.log(`STAFF_API_KEY=${staffApiKey}`);
    console.log(`STAFF_SESSION_TOKEN=${staffSessionToken}`);
    console.log(`STAFF_USERNAME=${staffUsername}`);
    console.log(`STAFF_PASSWORD_HASH=${staffPasswordHash}`);
    
    console.log('\n🔑 SECURE PASSWORDS (SAVE THESE SECURELY):');
    console.log('==========================================');
    console.log(`Admin Username: ${adminUsername}`);
    console.log(`Admin Password: ${adminPassword}`);
    console.log(`Staff Username: ${staffUsername}`);
    console.log(`Staff Password: ${staffPassword}`);
    
    console.log('\n⚠️ IMPORTANT SECURITY NOTES:');
    console.log('============================');
    console.log('1. Save these passwords in a secure password manager');
    console.log('2. Use the HASHED passwords in production environment');
    console.log('3. Never commit plain text passwords to version control');
    console.log('4. Rotate these credentials regularly');
    console.log('5. Use HTTPS only in production');
    
    // Write to secure file
    const secureConfig = `# QUINN - Production Security Configuration
# Generated: ${new Date().toISOString()}
# WARNING: Keep these credentials secure!

JWT_SECRET=${jwtSecret}
ADMIN_API_KEY=${adminApiKey}
ADMIN_SESSION_TOKEN=${adminSessionToken}
ADMIN_USERNAME=${adminUsername}
ADMIN_PASSWORD_HASH=${adminPasswordHash}
STAFF_API_KEY=${staffApiKey}
STAFF_SESSION_TOKEN=${staffSessionToken}
STAFF_USERNAME=${staffUsername}
STAFF_PASSWORD_HASH=${staffPasswordHash}

# Plain text passwords for initial setup (DELETE AFTER USE):
# Admin: ${adminPassword}
# Staff: ${staffPassword}
`;
    
    require('fs').writeFileSync('.env.production.secure.new', secureConfig);
    console.log('\n💾 Credentials saved to: .env.production.secure.new');
    console.log('📝 Review and rename to .env.production when ready');
    
    return {
        jwtSecret,
        adminApiKey,
        adminSessionToken,
        adminUsername,
        adminPassword,
        adminPasswordHash,
        staffApiKey,
        staffSessionToken,
        staffUsername,
        staffPassword,
        staffPasswordHash
    };
}

function generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
    
    // Fill remaining length
    for (let i = 4; i < length; i++) {
        password += charset[crypto.randomInt(0, charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Run if called directly
if (require.main === module) {
    generateSecureCredentials();
}

module.exports = { generateSecureCredentials };