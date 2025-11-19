#!/usr/bin/env python3
"""
Mommy HAI API Test Suite
Based on Postman collection and environment files
"""

import json
import requests
import time
import os
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from colorama import init, Fore, Back, Style
import logging

# Initialize colorama for colored output
init(autoreset=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class TestResult:
    """Test result data structure"""
    name: str
    method: str
    url: str
    status_code: int
    expected_status: int
    success: bool
    response_data: Any
    error_message: Optional[str] = None
    duration: float = 0.0


class MommyHAIApiTester:
    """Main API testing class"""
    
    def __init__(self):
        # Environment configuration
        self.env = {
            "url": "https://ffdvlfpwvtkttfbltuue.supabase.co",
            "apikey": "",
            "user": os.getenv('TEST_USER_EMAIL', ''),  # Set via environment variable
            "pass": os.getenv('TEST_USER_PASSWORD', ''),  # Set via environment variable
            "token": "",
            "contact_uuid": "",
            "partner_uuid": "",
            "user_uuid": "",
            "notification_uuid": ""
        }
        
        # Test results storage
        self.test_results: List[TestResult] = []
        
        # Session for connection pooling
        self.session = requests.Session()
        
    def print_header(self, title: str):
        """Print a formatted header"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{Fore.CYAN}{title.center(60)}")
        print(f"{Fore.CYAN}{'='*60}")
        
    def print_test_result(self, result: TestResult):
        """Print formatted test result"""
        status_color = Fore.GREEN if result.success else Fore.RED
        status_text = "✓ PASS" if result.success else "✗ FAIL"
        
        print(f"{status_color}{status_text} {result.name}")
        print(f"  {Fore.YELLOW}Method: {result.method}")
        print(f"  {Fore.YELLOW}URL: {result.url}")
        print(f"  {Fore.YELLOW}Status: {result.status_code} (expected: {result.expected_status})")
        print(f"  {Fore.YELLOW}Duration: {result.duration:.3f}s")
        
        if result.error_message:
            print(f"  {Fore.RED}Error: {result.error_message}")
        
        if result.response_data and isinstance(result.response_data, dict):
            if 'data' in result.response_data:
                print(f"  {Fore.BLUE}Response Data: {json.dumps(result.response_data.get('data', {}), indent=2)}")
        print()
        
    def make_request(self, method: str, url: str, headers: Dict[str, str], 
                    data: Optional[Dict] = None, expected_status: int = 200) -> TestResult:
        """Make HTTP request and return test result"""
        
        start_time = time.time()
        test_name = f"{method} {url.split('/')[-1] if '/' in url else url}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, headers=headers, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, headers=headers, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            elif method.upper() == 'OPTIONS':
                response = self.session.options(url, headers=headers)
            elif method.upper() == 'HEAD':
                response = self.session.head(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            duration = time.time() - start_time
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                response_data = {"raw_response": response.text}
            
            success = response.status_code == expected_status
            error_message = None if success else f"Status code mismatch: got {response.status_code}, expected {expected_status}"
            
            return TestResult(
                name=test_name,
                method=method.upper(),
                url=url,
                status_code=response.status_code,
                expected_status=expected_status,
                success=success,
                response_data=response_data,
                error_message=error_message,
                duration=duration
            )
            
        except Exception as e:
            duration = time.time() - start_time
            return TestResult(
                name=test_name,
                method=method.upper(),
                url=url,
                status_code=0,
                expected_status=expected_status,
                success=False,
                response_data=None,
                error_message=str(e),
                duration=duration
            )
    
    def authenticate(self) -> bool:
        """Authenticate and get access token"""
        self.print_header("AUTHENTICATION")
        
        # Set terminal token from collection (pre-request script)
        self.env["terminal.token"] = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjEyaEdTRW9QNkdlbHVxS1ciLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzEwMDU0NDkwLCJpYXQiOjE3MTAwNTA4OTAsImlzcyI6Imh0dHBzOi8vanR4ZWFheG94emdsd3J0aHJkaWwuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjkyYzA2M2E1LTQ0NDMtNGRmOS1hY2RmLTljMzFjOTZjNGE5NSIsImVtYWlsIjoiaXAwMDAwMDFAcG9zLmlwc3lzLmlvIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3MTAwNTA4OTB9XSwic2Vzc2lvbl9pZCI6IjU0MGI4OTQ2LWRjNmItNGNlYS1iMWI0LTU4ODU3ZmQ2NTljMyJ9.LXgYHqiZA7mnOLUIrepsIEhggK9XI0wO0qU6Dx0e8fo"
        
        # Login request
        login_url = f"{self.env['url']}/auth/v1/token"
        headers = {
            "apikey": self.env["apikey"],
            "Content-Type": "application/json"
        }
        data = {
            "email": self.env["user"],
            "password": self.env["pass"]
        }
        params = {"grant_type": "password"}
        
        try:
            response = self.session.post(f"{login_url}?grant_type=password", headers=headers, json=data)
            result = TestResult(
                name="LOGIN",
                method="POST",
                url=login_url,
                status_code=response.status_code,
                expected_status=200,
                success=response.status_code == 200,
                response_data=response.json() if response.status_code == 200 else None,
                error_message=None if response.status_code == 200 else f"Login failed: {response.text}"
            )
            
            self.test_results.append(result)
            self.print_test_result(result)
            
            if result.success and result.response_data:
                self.env["token"] = result.response_data.get("access_token", "")
                return True
                
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            
        return False
    
    def get_api_headers(self, use_token: bool = True) -> Dict[str, str]:
        """Get standard API headers"""
        headers = {
            "apikey": self.env["apikey"],
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-client-type": "api"
        }
        
        if use_token and self.env["token"]:
            headers["Authorization"] = f"Bearer {self.env['token']}"
        else:
            headers["Authorization"] = f"Bearer {self.env['apikey']}"
            
        return headers
    
    def test_contacts_api(self):
        """Test all Contacts API endpoints"""
        self.print_header("CONTACTS API TESTS")
        
        base_url = f"{self.env['url']}/functions/v1/contacts"
        
        # Test 1: Get All Contacts
        result = self.make_request("GET", base_url, self.get_api_headers(), expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Extract contact UUID if available
        if result.success and result.response_data and isinstance(result.response_data, dict):
            data = result.response_data.get('data', [])
            if data and len(data) > 0:
                self.env["contact_uuid"] = data[0].get('id', '')
        
        # Test 2: Create Contact
        contact_data = {
            "first_name": "John",
            "last_name": "Doe", 
            "phone_no": "+1234567890",
            "email": "john.doe@example.com"
        }
        
        result = self.make_request("POST", base_url, self.get_api_headers(), contact_data, expected_status=201)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Update contact UUID from creation
        if result.success and result.response_data and isinstance(result.response_data, dict):
            data = result.response_data.get('data', {})
            if data and 'id' in data:
                self.env["contact_uuid"] = data['id']
        
        # Test 3: Get Contact by ID (if we have a UUID)
        if self.env["contact_uuid"]:
            get_by_id_url = f"{base_url}/{self.env['contact_uuid']}"
            result = self.make_request("GET", get_by_id_url, self.get_api_headers(), expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 4: Update Contact (if we have a UUID)
        if self.env["contact_uuid"]:
            update_data = {"first_name": "John Updated"}
            update_url = f"{base_url}/{self.env['contact_uuid']}"
            result = self.make_request("PUT", update_url, self.get_api_headers(), update_data, expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 5: Options (Get function status)
        result = self.make_request("OPTIONS", base_url, self.get_api_headers(), expected_status=204)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 6: Method not allowed (HEAD)
        result = self.make_request("HEAD", base_url, self.get_api_headers(), expected_status=405)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 7: Delete Contact (if we have a UUID) - Do this last
        if self.env["contact_uuid"]:
            delete_url = f"{base_url}/{self.env['contact_uuid']}"
            result = self.make_request("DELETE", delete_url, self.get_api_headers(), expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
    
    def test_blank_api(self):
        """Test all Blank API endpoints"""
        self.print_header("BLANK API TESTS")
        
        base_url = f"{self.env['url']}/functions/v1/blank"
        
        # Test 1: Get All
        result = self.make_request("GET", base_url, self.get_api_headers(use_token=False), expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 2: Create
        blank_data = {"requiredField": {"field": "value"}}
        result = self.make_request("POST", base_url, self.get_api_headers(use_token=False), blank_data, expected_status=201)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 3: Get by ID
        get_by_id_url = f"{base_url}/1"
        result = self.make_request("GET", get_by_id_url, self.get_api_headers(use_token=False), expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 4: Update
        update_data = {"test": "true"}
        update_url = f"{base_url}/1"
        result = self.make_request("PUT", update_url, self.get_api_headers(use_token=False), update_data, expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 5: Delete
        delete_url = f"{base_url}/1"
        result = self.make_request("DELETE", delete_url, self.get_api_headers(use_token=False), expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 6: Options
        result = self.make_request("OPTIONS", base_url, self.get_api_headers(use_token=False), expected_status=204)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 7: Method not allowed
        result = self.make_request("HEAD", base_url, self.get_api_headers(use_token=False), expected_status=405)
        self.test_results.append(result)
        self.print_test_result(result)
    
    def test_partners_api(self):
        """Test all Partners API endpoints"""
        self.print_header("PARTNERS API TESTS")
        
        base_url = f"{self.env['url']}/functions/v1/partners"
        
        # Test 1: Get All Partners
        result = self.make_request("GET", base_url, self.get_api_headers(), expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Extract partner UUID if available
        if result.success and result.response_data and isinstance(result.response_data, dict):
            data = result.response_data.get('data', [])
            if data and len(data) > 0:
                self.env["partner_uuid"] = data[0].get('id', '')
        
        # Test 2: Create Partner (need contact_uuid first)
        if self.env.get("contact_uuid"):
            partner_data = {
                "company_name": "Advanced Manufacturing Corp",
                "tax_id": "987654321",
                "registration_number": "REG-2024-001",
                "address": "123 Business Street, Suite 100, City, State 12345",
                "bank_account": "1234567890123456",
                "bank_name": "First National Bank",
                "administrator_contact_id": self.env["contact_uuid"],
                "is_active": True,
                "business_email": "info@advancedmfg.com",
                "orders_email": "orders@advancedmfg.com"
            }
            
            result = self.make_request("POST", base_url, self.get_api_headers(), partner_data, expected_status=201)
            self.test_results.append(result)
            self.print_test_result(result)
            
            # Update partner UUID from creation
            if result.success and result.response_data and isinstance(result.response_data, dict):
                data = result.response_data.get('data', {})
                if data and 'id' in data:
                    self.env["partner_uuid"] = data['id']
        
        # Test 3: Get Partner by ID (if we have a UUID)
        if self.env["partner_uuid"]:
            get_by_id_url = f"{base_url}/{self.env['partner_uuid']}"
            result = self.make_request("GET", get_by_id_url, self.get_api_headers(), expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 4: Update Partner (if we have a UUID)
        if self.env["partner_uuid"]:
            update_data = {"company_name": "Updated Manufacturing Corp"}
            update_url = f"{base_url}/{self.env['partner_uuid']}"
            result = self.make_request("PUT", update_url, self.get_api_headers(), update_data, expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 5: Options (Get function status)
        result = self.make_request("OPTIONS", base_url, self.get_api_headers(), expected_status=204)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 6: Method not allowed (HEAD)
        result = self.make_request("HEAD", base_url, self.get_api_headers(), expected_status=405)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 7: Delete Partner (if we have a UUID) - Do this last
        if self.env["partner_uuid"]:
            delete_url = f"{base_url}/{self.env['partner_uuid']}"
            result = self.make_request("DELETE", delete_url, self.get_api_headers(), expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
    
    def test_users_api(self):
        """Test all Users API endpoints"""
        self.print_header("USERS API TESTS")
        
        base_url = f"{self.env['url']}/functions/v1/users"
        
        # Test 1: Get All Users
        result = self.make_request("GET", base_url, self.get_api_headers(), expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Extract user UUID if available
        if result.success and result.response_data and isinstance(result.response_data, dict):
            data = result.response_data.get('data', [])
            if data and len(data) > 0:
                self.env["user_uuid"] = data[0].get('id', '')
        
        # Test 2: Get User by ID (if we have a UUID)
        if self.env["user_uuid"]:
            get_by_id_url = f"{base_url}/{self.env['user_uuid']}"
            result = self.make_request("GET", get_by_id_url, self.get_api_headers(), expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 3: Create User
        timestamp = int(time.time())
        user_data = {
            "email": f"testuser{timestamp}@example.com",
            "raw_app_meta_data": {
                "first_name": "Test",
                "last_name": "User",
                "userrole": "user"
            },
            "phone": f"+123456{timestamp % 10000}"
        }
        result = self.make_request("POST", base_url, self.get_api_headers(), user_data, expected_status=201)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Update user UUID from creation
        if result.success and result.response_data and isinstance(result.response_data, dict):
            data = result.response_data.get('data', {})
            if data and 'id' in data:
                self.env["user_uuid"] = data['id']
        
        # Test 4: Update User (if we have a UUID)
        if self.env["user_uuid"]:
            update_data = {
                "raw_app_meta_data": {
                    "first_name": "Updated",
                    "last_name": "User",
                    "userrole": "admin"
                }
            }
            update_url = f"{base_url}/{self.env['user_uuid']}"
            result = self.make_request("PUT", update_url, self.get_api_headers(), update_data, expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 5: Options (Get function status)
        result = self.make_request("OPTIONS", base_url, self.get_api_headers(), expected_status=204)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 6: Method not allowed (HEAD)
        result = self.make_request("HEAD", base_url, self.get_api_headers(), expected_status=405)
        self.test_results.append(result)
        self.print_test_result(result)
    
    def test_notifications_api(self):
        """Test all Notifications API endpoints"""
        self.print_header("NOTIFICATIONS API TESTS")
        
        base_url = f"{self.env['url']}/functions/v1/notifications"
        
        # Test 1: Get All Notifications
        result = self.make_request("GET", base_url, self.get_api_headers(), expected_status=200)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Extract notification UUID if available
        if result.success and result.response_data and isinstance(result.response_data, dict):
            data = result.response_data.get('data', [])
            if data and len(data) > 0:
                self.env["notification_uuid"] = data[0].get('id', '')
        
        # Test 2: Create Notification
        notification_data = {
            "title": "System Maintenance Notice",
            "body": "The system will be under maintenance from 2 AM to 4 AM UTC. Please save your work before this time."
        }
        
        result = self.make_request("POST", base_url, self.get_api_headers(), notification_data, expected_status=201)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Update notification UUID from creation
        if result.success and result.response_data and isinstance(result.response_data, dict):
            data = result.response_data.get('data', {})
            if data and 'id' in data:
                self.env["notification_uuid"] = data['id']
        
        # Test 3: Get Notification by ID (if we have a UUID)
        if self.env["notification_uuid"]:
            get_by_id_url = f"{base_url}/{self.env['notification_uuid']}"
            result = self.make_request("GET", get_by_id_url, self.get_api_headers(), expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 4: Update Notification (if we have a UUID)
        if self.env["notification_uuid"]:
            update_data = {"title": "Updated System Maintenance Notice"}
            update_url = f"{base_url}/{self.env['notification_uuid']}"
            result = self.make_request("PUT", update_url, self.get_api_headers(), update_data, expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
        
        # Test 5: Options (Get function status)
        result = self.make_request("OPTIONS", base_url, self.get_api_headers(), expected_status=204)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 6: Method not allowed (HEAD)
        result = self.make_request("HEAD", base_url, self.get_api_headers(), expected_status=405)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 7: Delete Notification (if we have a UUID) - Do this last
        if self.env["notification_uuid"]:
            delete_url = f"{base_url}/{self.env['notification_uuid']}"
            result = self.make_request("DELETE", delete_url, self.get_api_headers(), expected_status=200)
            self.test_results.append(result)
            self.print_test_result(result)
    
    def test_contacts_validation(self):
        """Test Contacts API validation"""
        self.print_header("CONTACTS VALIDATION TESTS")
        
        base_url = f"{self.env['url']}/functions/v1/contacts"
        
        # Test 1: Create contact without required first_name
        invalid_contact_data = {
            "last_name": "Doe",
            "email": "test@example.com"
        }
        
        result = self.make_request("POST", base_url, self.get_api_headers(), invalid_contact_data, expected_status=400)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 2: Create contact without required last_name
        invalid_contact_data = {
            "first_name": "John",
            "email": "test@example.com"
        }
        
        result = self.make_request("POST", base_url, self.get_api_headers(), invalid_contact_data, expected_status=400)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 3: Create contact with invalid email format
        invalid_contact_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "invalid-email"
        }
        
        result = self.make_request("POST", base_url, self.get_api_headers(), invalid_contact_data, expected_status=400)
        self.test_results.append(result)
        self.print_test_result(result)
        
        # Test 4: Create contact with empty strings
        invalid_contact_data = {
            "first_name": "",
            "last_name": "Doe",
            "email": "test@example.com"
        }
        
        result = self.make_request("POST", base_url, self.get_api_headers(), invalid_contact_data, expected_status=400)
        self.test_results.append(result)
        self.print_test_result(result)
    
    def print_summary(self):
        """Print test execution summary"""
        self.print_header("TEST EXECUTION SUMMARY")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result.success)
        failed_tests = total_tests - passed_tests
        
        print(f"{Fore.CYAN}Total Tests: {total_tests}")
        print(f"{Fore.GREEN}Passed: {passed_tests}")
        print(f"{Fore.RED}Failed: {failed_tests}")
        print(f"{Fore.YELLOW}Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n{Fore.RED}Failed Tests:")
            for result in self.test_results:
                if not result.success:
                    print(f"  - {result.name}: {result.error_message}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"{Fore.MAGENTA}{Style.BRIGHT}🚀 Starting Mommy HAI API Test Suite")
        print(f"{Fore.MAGENTA}Base URL: {self.env['url']}")
        
        # NOTE: You must set the API key before running
        if not self.env["apikey"]:
            print(f"{Fore.RED}❌ ERROR: API key not set!")
            print(f"{Fore.YELLOW}Please set the SUPABASE_ANON_KEY in the apikey field")
            return
        
        start_time = time.time()
        
        # Authenticate first
        if not self.authenticate():
            print(f"{Fore.RED}❌ Authentication failed! Skipping authenticated tests.")
            # Run non-authenticated tests only
            self.test_blank_api()
        else:
            # Run all tests
            self.test_contacts_api()
            self.test_blank_api()
            self.test_partners_api()
            self.test_users_api()
            self.test_notifications_api()
            # Skip user_notifications - endpoint not implemented yet
            # self.test_user_notifications_api()
            self.test_contacts_validation()
        
        end_time = time.time()
        
        self.print_summary()
        print(f"\n{Fore.MAGENTA}⏱️  Total execution time: {end_time - start_time:.2f} seconds")


def main():
    """Main function"""
    tester = MommyHAIApiTester()
    
    # Check for required environment variables
    api_key = os.getenv('SUPABASE_ANON_KEY')
    test_user = os.getenv('TEST_USER_EMAIL')
    test_pass = os.getenv('TEST_USER_PASSWORD')
    
    if not api_key:
        print(f"{Fore.RED}❌ SUPABASE_ANON_KEY environment variable not set!")
        print(f"{Fore.YELLOW}Set it with: export SUPABASE_ANON_KEY='your_supabase_anon_key'")
        return
    
    if not test_user or not test_pass:
        print(f"{Fore.RED}❌ Test user credentials not set!")
        print(f"{Fore.YELLOW}Set them with:")
        print(f"{Fore.YELLOW}  export TEST_USER_EMAIL='your_test_user@example.com'")
        print(f"{Fore.YELLOW}  export TEST_USER_PASSWORD='your_test_password'")
        print(f"{Fore.CYAN}ℹ️  Note: Use a test user account with admin privileges")
        return
        
    tester.env["apikey"] = api_key
    tester.env["user"] = test_user
    tester.env["pass"] = test_pass
    tester.run_all_tests()


def run_automated_test():
    """Run tests in automated mode (for CI/CD)"""
    
    # Check for required environment variables
    api_key = os.getenv('SUPABASE_ANON_KEY')
    test_user = os.getenv('TEST_USER_EMAIL')
    test_pass = os.getenv('TEST_USER_PASSWORD')
    
    if not api_key:
        print(f"{Fore.RED}❌ SUPABASE_ANON_KEY environment variable not set!")
        print(f"{Fore.YELLOW}Set it in GitHub Secrets or environment")
        return False
    
    if not test_user or not test_pass:
        print(f"{Fore.RED}❌ Test user credentials not set!")
        print(f"{Fore.YELLOW}Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables")
        return False
    
    tester = MommyHAIApiTester()
    tester.env["apikey"] = api_key
    tester.env["user"] = test_user
    tester.env["pass"] = test_pass
    tester.run_all_tests()
    
    # Return success/failure for CI/CD
    total_tests = len(tester.test_results)
    passed_tests = sum(1 for result in tester.test_results if result.success)
    return passed_tests == total_tests


if __name__ == "__main__":
    main()