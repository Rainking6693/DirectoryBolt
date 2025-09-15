# Google Sheets Service Account File Migration

## Overview
This migration updates DirectoryBolt's Google Sheets integration to use a service account file instead of environment variables, resolving the 4KB environment variable limit issue in Netlify.

## Problem Solved
- **4KB Environment Variable Limit**: Netlify has a 4KB limit for environment variables, and the `GOOGLE_PRIVATE_KEY` was exceeding this limit
- **Deployment Failures**: Large environment variables were causing deployment failures
- **AWS Lambda Compatibility**: Service account files are more compatible with serverless environments

## Solution
Instead of storing Google service account credentials in environment variables:
```bash
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
GOOGLE_SERVICE_ACCOUNT_EMAIL=directorybolt-service-58@directorybolt.iam.gserviceaccount.com
```

We now use a service account file at `/config/google-service-account.json`:
```json
{
  "type": "service_account",
  "project_id": "directorybolt",
  "private_key": "-----BEGIN PRIVATE KEY-----...",
  "client_email": "directorybolt-service-58@directorybolt.iam.gserviceaccount.com",
  ...
}
```

## Files Modified

### Core Services
1. **`lib/services/google-sheets.js`** - Main Google Sheets service
   - Added service account file loading logic
   - Maintains fallback to environment variables
   - Enhanced configuration detection

2. **`lib/google-sheets-fallback.js`** - Fallback service
   - Updated to check for service account file first
   - Maintains backward compatibility

3. **`lib/services/queue-manager.ts`** - Queue processing service
   - Updated configuration checks to include service account file
   - Enhanced diagnostic logging

### API Routes
4. **`pages/api/extension/validate.ts`** - Extension validation
   - Added service account file detection
   - Enhanced diagnostic information

5. **`pages/api/extension/secure-validate.ts`** - Secure validation
   - Updated configuration validation logic
   - Added service account file support

6. **`pages/api/system-status.ts`** - System status API
   - Enhanced configuration reporting
   - Shows which method is being used (file vs env vars)

### Netlify Functions
7. **`netlify/functions/customer-validate.js`** - Customer validation function
   - Added service account file detection
   - Enhanced environment diagnostics

8. **`netlify/functions/extension-secure-validate.js`** - Secure validation function
   - Updated configuration checks
   - Added service account file support

9. **`netlify/functions/health-google-sheets.js`** - Health check function
   - Enhanced configuration validation
   - Shows configuration method in health reports

### Configuration
10. **`config/google-service-account.json`** - Service account credentials
    - Contains complete Google service account configuration
    - Replaces environment variables for authentication

## Implementation Details

### Configuration Loading Logic
All services now follow this pattern:
1. Check if `/config/google-service-account.json` exists
2. If file exists, load credentials from file
3. If file doesn't exist, fall back to environment variables
4. If neither is available, provide clear error messages

### Backward Compatibility
- All existing environment variable configurations continue to work
- Services automatically detect which method to use
- No breaking changes for existing deployments

### Enhanced Diagnostics
- All services now report which configuration method they're using
- Health checks show detailed configuration status
- Error messages clearly indicate missing configuration

## Testing

### Test Script
A test script `test-service-account-file.js` has been created to verify the integration:
```bash
node test-service-account-file.js
```

### Verification Steps
1. Service creation and initialization
2. Health check validation
3. Customer lookup functionality
4. Configuration method detection

## Benefits

1. **Resolves 4KB Limit**: Service account file bypasses Netlify's environment variable size limit
2. **Better Security**: Credentials are stored in a file rather than environment variables
3. **Improved Diagnostics**: Clear reporting of configuration method and status
4. **Backward Compatibility**: Existing environment variable setups continue to work
5. **Enhanced Error Handling**: Better error messages for configuration issues

## Deployment Notes

### For Netlify
- The service account file should be included in the repository
- Environment variables are no longer required for Google Sheets authentication
- The `GOOGLE_SHEET_ID` can still be set as an environment variable if needed

### For Local Development
- Ensure `/config/google-service-account.json` exists
- The file contains valid Google service account credentials
- Test with `node test-service-account-file.js`

## Migration Checklist

- [x] Update core Google Sheets service
- [x] Update fallback service
- [x] Update queue manager
- [x] Update API routes
- [x] Update Netlify functions
- [x] Update system status reporting
- [x] Create test script
- [x] Add service account file
- [x] Document changes
- [x] Add reviewer notes

## Next Steps

1. Deploy to Netlify with the service account file
2. Verify all Google Sheets functionality works
3. Monitor system status for configuration method reporting
4. Remove large environment variables from Netlify if desired
5. Test extension validation with the new configuration

## Rollback Plan

If issues occur, the system will automatically fall back to environment variables since backward compatibility is maintained. Simply ensure the environment variables are properly set in Netlify.