
# Standard Directory Automation
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def submit_to_standard_directory(url, business_data, field_mapping):
    """Submit to standard business directory"""
    driver = webdriver.Chrome()
    try:
        driver.get(url)
        
        # Find and fill form fields
        for field, selector in field_mapping.items():
            if field in business_data:
                element = driver.find_element(By.CSS_SELECTOR, selector)
                if element.tag_name == 'select':
                    # Handle dropdown
                    from selenium.webdriver.support.ui import Select
                    select = Select(element)
                    select.select_by_visible_text(business_data[field])
                else:
                    element.send_keys(business_data[field])
        
        # Submit form
        submit_button = driver.find_element(By.XPATH, "//input[@type='submit'] | //button[@type='submit']")
        submit_button.click()
        
        # Check for success
        time.sleep(3)
        success_indicators = [".success", ".confirmation", "[class*='success']"]
        for indicator in success_indicators:
            try:
                driver.find_element(By.CSS_SELECTOR, indicator)
                return {"success": True, "message": "Successfully submitted"}
            except:
                continue
        
        return {"success": False, "error": "No success confirmation found"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        driver.quit()
