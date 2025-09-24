import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse
import time
from datetime import datetime
import ssl
import urllib3

# Disable SSL warnings for testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_url(directory_info, timeout=10):
    """Test if a directory URL is accessible"""
    directory = directory_info
    url = directory.get('url', '')
    name = directory.get('name', 'Unknown')
    
    result = {
        'id': directory.get('id'),
        'name': name,
        'url': url,
        'submission_url': directory.get('submissionUrl', ''),
        'category': directory.get('category'),
        'domain_authority': directory.get('domainAuthority', 0),
        'accessible': False,
        'status_code': None,
        'response_time': None,
        'error': None,
        'redirect_url': None,
        'submission_accessible': False
    }
    
    # Test main URL
    start_time = time.time()
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, verify=False)
        result['status_code'] = response.status_code
        result['response_time'] = round(time.time() - start_time, 2)
        result['accessible'] = response.status_code < 400
        
        if response.url != url:
            result['redirect_url'] = response.url
            
    except requests.exceptions.Timeout:
        result['error'] = 'Timeout'
        result['response_time'] = timeout
    except requests.exceptions.SSLError:
        result['error'] = 'SSL Error'
    except requests.exceptions.ConnectionError:
        result['error'] = 'Connection Error'
    except Exception as e:
        result['error'] = str(e)[:100]
    
    # Test submission URL if main URL is accessible
    if result['accessible'] and result.get('submission_url'):
        try:
            sub_response = requests.get(
                result['submission_url'], 
                headers=headers, 
                timeout=5, 
                allow_redirects=True, 
                verify=False
            )
            result['submission_accessible'] = sub_response.status_code < 400
        except:
            result['submission_accessible'] = False
    
    return result

def test_directories_batch(directories, max_workers=20):
    """Test multiple directories concurrently"""
    results = []
    total = len(directories)
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_dir = {executor.submit(test_url, d): d for d in directories}
        
        completed = 0
        for future in as_completed(future_to_dir):
            completed += 1
            try:
                result = future.result()
                results.append(result)
                
                # Print progress
                status = "OK" if result['accessible'] else "FAIL"
                print(f"[{completed}/{total}] {status} {result['name'][:40]:40} - {result['status_code'] or result['error']}")
                
            except Exception as e:
                print(f"[{completed}/{total}] ERROR: Error processing directory: {e}")
    
    return results

def generate_audit_report(test_results, total_directories):
    """Generate honest audit report"""
    
    accessible_count = sum(1 for r in test_results if r['accessible'])
    submission_accessible = sum(1 for r in test_results if r['submission_accessible'])
    
    # Calculate statistics
    stats = {
        'total_directories': total_directories,
        'directories_tested': len(test_results),
        'accessible': accessible_count,
        'inaccessible': len(test_results) - accessible_count,
        'accessibility_rate': round(accessible_count / len(test_results) * 100, 1),
        'submission_forms_accessible': submission_accessible,
        'average_response_time': round(
            sum(r['response_time'] for r in test_results if r['response_time']) / 
            len([r for r in test_results if r['response_time']]), 2
        ),
        'errors_breakdown': {}
    }
    
    # Count error types
    for result in test_results:
        if result['error']:
            error_type = result['error'].split(':')[0].strip()
            stats['errors_breakdown'][error_type] = stats['errors_breakdown'].get(error_type, 0) + 1
    
    # Category breakdown
    category_stats = {}
    for result in test_results:
        cat = result['category']
        if cat not in category_stats:
            category_stats[cat] = {'total': 0, 'accessible': 0}
        category_stats[cat]['total'] += 1
        if result['accessible']:
            category_stats[cat]['accessible'] += 1
    
    # High-value directories (DA >= 60)
    high_da_results = [r for r in test_results if r['domain_authority'] >= 60]
    high_da_accessible = sum(1 for r in high_da_results if r['accessible'])
    
    report = f"""
================================================================================
DIRECTORYBOLT URL ACCESSIBILITY AUDIT REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================================

EXECUTIVE SUMMARY
-----------------
Total Directories in Database: {stats['total_directories']}
Directories Tested: {stats['directories_tested']}
Testing Coverage: {round(stats['directories_tested'] / stats['total_directories'] * 100, 1)}%

ACCESSIBILITY RESULTS
---------------------
ACCESSIBLE: {stats['accessible']} ({stats['accessibility_rate']}%)
INACCESSIBLE: {stats['inaccessible']} ({round(100 - stats['accessibility_rate'], 1)}%)
AVG RESPONSE TIME: {stats['average_response_time']}s

SUBMISSION FORM ANALYSIS
------------------------
Forms Accessible: {stats['submission_forms_accessible']} / {stats['accessible']} accessible sites
Form Coverage Rate: {round(stats['submission_forms_accessible'] / stats['accessible'] * 100, 1) if stats['accessible'] > 0 else 0}%

HIGH-VALUE DIRECTORIES (DA >= 60)
----------------------------------
Tested: {len(high_da_results)}
Accessible: {high_da_accessible} ({round(high_da_accessible / len(high_da_results) * 100, 1) if high_da_results else 0}%)

ERROR BREAKDOWN
---------------"""
    
    for error_type, count in sorted(stats['errors_breakdown'].items(), key=lambda x: x[1], reverse=True):
        report += f"\n{error_type}: {count}"
    
    report += f"""

CATEGORY PERFORMANCE
--------------------"""
    
    for cat, cat_stats in sorted(category_stats.items(), key=lambda x: x[1]['total'], reverse=True):
        acc_rate = round(cat_stats['accessible'] / cat_stats['total'] * 100, 1)
        report += f"\n{cat:20} {cat_stats['accessible']:3}/{cat_stats['total']:3} ({acc_rate:5.1f}%)"
    
    report += f"""

TOP 10 ACCESSIBLE HIGH-VALUE DIRECTORIES
-----------------------------------------"""
    
    accessible_sorted = sorted(
        [r for r in test_results if r['accessible']], 
        key=lambda x: x['domain_authority'], 
        reverse=True
    )[:10]
    
    for i, dir in enumerate(accessible_sorted, 1):
        report += f"\n{i:2}. {dir['name'][:30]:30} (DA: {dir['domain_authority']:3}) - {dir['url']}"
    
    report += f"""

TOP 10 INACCESSIBLE DIRECTORIES TO FIX
---------------------------------------"""
    
    inaccessible_sorted = sorted(
        [r for r in test_results if not r['accessible']], 
        key=lambda x: x['domain_authority'], 
        reverse=True
    )[:10]
    
    for i, dir in enumerate(inaccessible_sorted, 1):
        report += f"\n{i:2}. {dir['name'][:30]:30} (DA: {dir['domain_authority']:3}) - {dir['error']}"
    
    report += f"""

HONEST ASSESSMENT
-----------------
• Real Accessibility Rate: {stats['accessibility_rate']}%
• Directories Requiring Updates: {stats['inaccessible']}
• High-Priority Fixes Needed: {len(high_da_results) - high_da_accessible}
• Form Mapping Coverage: {round(stats['submission_forms_accessible'] / stats['directories_tested'] * 100, 1)}%

RECOMMENDATIONS
---------------
1. Remove or update {stats['inaccessible']} inaccessible directories
2. Prioritize fixing high-DA directories first
3. Implement automated monitoring for URL changes
4. Add fallback URLs for critical directories
5. Update submission URLs based on actual form locations

================================================================================
"""
    
    return report, stats

def main():
    """Main execution"""
    print("DirectoryBolt URL Accessibility Tester")
    print("=" * 50)
    
    # Load directories
    print("\nLoading directory database...")
    with open('directories/complete-directory-database.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    directories = data['directories']
    total = len(directories)
    print(f"Total directories loaded: {total}")
    
    # Test top 100 directories by Domain Authority
    print("\nSelecting top 100 directories by Domain Authority...")
    sorted_dirs = sorted(directories, key=lambda x: x.get('domainAuthority', 0), reverse=True)
    test_batch = sorted_dirs[:100]
    
    print(f"\nTesting {len(test_batch)} directories...")
    print("-" * 50)
    
    # Run tests
    test_results = test_directories_batch(test_batch, max_workers=20)
    
    # Generate report
    print("\n" + "=" * 50)
    print("Generating audit report...")
    
    report, stats = generate_audit_report(test_results, total)
    
    # Save results
    with open('directories/url-test-results.json', 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'test_date': datetime.now().isoformat(),
                'total_directories': total,
                'directories_tested': len(test_results),
                'statistics': stats
            },
            'results': test_results
        }, f, indent=2)
    
    with open('directories/accessibility-audit-report.txt', 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(report)
    
    print("\nFiles saved:")
    print("  - directories/url-test-results.json")
    print("  - directories/accessibility-audit-report.txt")
    
    return stats

if __name__ == "__main__":
    stats = main()