
# Batch Directory Submission
import json
import time
from concurrent.futures import ThreadPoolExecutor
from standard_directory import submit_to_standard_directory

def batch_submit_directories(business_data, directories, max_workers=3):
    """Submit business to multiple directories concurrently"""
    
    results = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []
        
        for directory in directories:
            if directory['accessible']:
                future = executor.submit(
                    submit_to_standard_directory,
                    directory['submission_url'],
                    business_data,
                    directory['field_mapping']
                )
                futures.append((future, directory))
        
        for future, directory in futures:
            try:
                result = future.result(timeout=60)
                result['directory'] = directory['name']
                result['url'] = directory['url']
                results.append(result)
                
                print(f"{'✓' if result['success'] else '✗'} {directory['name']}")
                
            except Exception as e:
                results.append({
                    'success': False,
                    'error': str(e),
                    'directory': directory['name'],
                    'url': directory['url']
                })
            
            # Rate limiting
            time.sleep(2)
    
    return results

if __name__ == "__main__":
    # Example usage
    business_data = {
        'name': 'DirectoryBolt',
        'address': '123 Business St',
        'city': 'San Francisco',
        'state': 'CA',
        'zip': '94102',
        'phone': '(555) 123-4567',
        'website': 'https://directorybolt.com',
        'email': 'info@directorybolt.com',
        'description': 'AI-powered business intelligence and directory submission platform'
    }
    
    # Load accessible directories
    with open('../directories/url-test-results.json', 'r') as f:
        data = json.load(f)
    
    accessible_dirs = [r for r in data['results'] if r['accessible']][:10]  # Top 10 for testing
    
    results = batch_submit_directories(business_data, accessible_dirs)
    
    success_count = sum(1 for r in results if r['success'])
    print(f"\nSubmission Results: {success_count}/{len(results)} successful")
