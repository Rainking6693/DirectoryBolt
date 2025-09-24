
# Google Business Profile Automation
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def submit_to_google_business(business_data):
    """Submit business to Google Business Profile"""
    driver = webdriver.Chrome()
    try:
        driver.get("https://www.google.com/business")
        
        # Handle login flow
        WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Manage now')]"))
        ).click()
        
        # Fill business information
        driver.find_element(By.NAME, "business_name").send_keys(business_data['name'])
        driver.find_element(By.NAME, "address").send_keys(business_data['address'])
        driver.find_element(By.NAME, "phone").send_keys(business_data['phone'])
        
        # Submit form
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        
        # Wait for confirmation
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CLASS_NAME, "success-message"))
        )
        
        return {"success": True, "message": "Successfully submitted to Google Business Profile"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        driver.quit()
