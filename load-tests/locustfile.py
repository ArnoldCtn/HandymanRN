"""
HandymanRN Scalability Load Testing Suite
Tests the application's ability to handle concurrent users and identifies breaking points.

Usage:
    locust -f locustfile.py --headless -u 100 -r 10 --run-time 5m --host http://localhost:8000
"""

from locust import HttpUser, task, between, SequentialTaskSet
import json
import random
import string


class HandymanUserBehavior(SequentialTaskSet):
    """Simulates a typical user journey through the HandymanRN app"""
    
    def on_start(self):
        """Called when a simulated user starts - perform authentication"""
        self.register_and_login()
    
    def generate_random_email(self):
        """Generate random email for testing"""
        username = ''.join(random.choices(string.ascii_lowercase, k=8))
        return f"{username}@test.com"
    
    def generate_random_phone(self):
        """Generate random Cameroon phone number"""
        prefixes = ['237', '+237']
        prefix = random.choice(prefixes)
        number = ''.join(random.choices(string.digits, k=9))
        return f"{prefix}{number}"
    
    @task(1)
    def register_and_login(self):
        """User registration and authentication flow"""
        email = self.generate_random_email()
        password = "TestPass123!"
        
        # Try registration
        with self.client.post("/users/signup/", json={
            "email": email,
            "password": password,
            "first_name": "Test",
            "last_name": "User",
            "user_type": "client"
        }, catch_response=True) as response:
            if response.status_code in [200, 201]:
                response.success()
            elif response.status_code == 400:
                # User might already exist, try login
                self.login_user(email, password)
            else:
                response.failure(f"Registration failed: {response.status_code}")
    
    def login_user(self, email, password):
        """Login existing user"""
        with self.client.post("/users/signin/", json={
            "email": email,
            "password": password
        }, catch_response=True) as response:
            if response.status_code == 200:
                self.token = response.json().get('access_token')
                response.success()
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    @task(5)
    def view_services(self):
        """Browse available services - high frequency task"""
        self.client.get("/services/", name="View Services List")
    
    @task(3)
    def view_handymen(self):
        """Browse handymen list"""
        self.client.get("/handymen/search/", name="View Handymen List")
    
    @task(2)
    def view_handyman_detail(self):
        """View specific handyman profile"""
        # Simulate viewing handyman ID 1-10
        handyman_id = random.randint(1, 10)
        self.client.get(f"/handymen/{handyman_id}/", name="View Handyman Detail")
    
    @task(2)
    def search_services(self):
        """Search for specific services"""
        service_types = ['plumbing', 'electrical', 'cleaning', 'painting', 'carpentry']
        search_term = random.choice(service_types)
        self.client.get(f"/services/?search={search_term}", name="Search Services")
    
    @task(1)
    def view_bookings(self):
        """View user's bookings"""
        self.client.get("/bookings/", name="View My Bookings")
    
    @task(1)
    def create_booking(self):
        """Create a new booking request"""
        with self.client.post("/bookings/", json={
            "handyman_id": random.randint(1, 10),
            "service_id": random.randint(1, 10),
            "scheduled_date": "2026-12-20T10:00:00Z",
            "description": "Need help with repair",
            "total_amount": random.randint(5000, 50000)
        }, catch_response=True) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure(f"Booking creation failed: {response.status_code}")
    
    @task(1)
    def view_notifications(self):
        """Check notifications"""
        self.client.get("/notifications/", name="View Notifications")
    
    @task(1)
    def check_wallet(self):
        """View wallet balance"""
        self.client.get("/payments/wallet/", name="View Wallet")


class AdminUserBehavior(SequentialTaskSet):
    """Simulates admin operations - lower frequency but resource-intensive"""
    
    @task(1)
    def view_dashboard(self):
        """Admin dashboard with statistics"""
        self.client.get("/admin/", name="Admin Dashboard")
    
    @task(1)
    def view_pending_verifications(self):
        """Check pending handyman verifications"""
        self.client.get("/admin/handymen/handyman/", name="View Pending Verifications")


class HandymanUserBehavior(SequentialTaskSet):
    """Simulates handyman-specific actions"""
    
    def on_start(self):
        """Login as handyman"""
        email = self.generate_random_email()
        with self.client.post("/handymen/signup/", json={
            "email": email,
            "password": "TestPass123!",
            "user_type": "handyman"
        }, catch_response=True) as response:
            if response.status_code in [200, 201]:
                response.success()
    
    @task(3)
    def view_available_jobs(self):
        """Check available job requests"""
        self.client.get("/bookings/", name="View Available Jobs")
    
    @task(2)
    def update_availability(self):
        """Toggle online status"""
        self.client.post("/handymen/me/online/", name="Toggle Online Status")
    
    @task(1)
    def view_earnings(self):
        """Check earnings and wallet"""
        self.client.get("/payments/wallet/", name="View Handyman Wallet")


class ScalabilityTestUser(HttpUser):
    """Main user class that randomly selects between user types"""
    
    # Simulate realistic user think time (2-10 seconds between actions)
    wait_time = between(2, 10)
    
    # Weight different user types (80% clients, 15% handymen, 5% admins)
    tasks = {
        HandymanUserBehavior: 15,
        AdminUserBehavior: 5
    }


# Custom load shapes for different test scenarios

class LoadTestShape:
    """
    Different load testing scenarios:
    1. Ramp-up: Gradually increase load
    2. Spike: Sudden traffic spike
    3. Stress: Find breaking point
    """
    
    @staticmethod
    def ramp_up_test():
        """Gradually increase users from 10 to 1000 over 30 minutes"""
        return {
            "start_user_count": 10,
            "end_user_count": 1000,
            "spawn_rate": 10,
            "run_time": "30m"
        }
    
    @staticmethod
    def spike_test():
        """Simulate sudden traffic spike (e.g., marketing campaign)"""
        return {
            "start_user_count": 100,
            "end_user_count": 2000,
            "spawn_rate": 100,
            "run_time": "10m"
        }
    
    @staticmethod
    def stress_test():
        """Find breaking point - keep increasing until failure"""
        return {
            "start_user_count": 100,
            "end_user_count": 5000,
            "spawn_rate": 50,
            "run_time": "45m"
        }


# Performance thresholds for pass/fail criteria
class PerformanceThresholds:
    """Define acceptable performance metrics"""
    
    # Response time thresholds (in milliseconds)
    MAX_RESPONSE_TIME = {
        'auth': 500,        # Login/Register
        'read': 200,        # GET requests
        'write': 800,       # POST/PUT requests
        'search': 300,      # Search operations
    }
    
    # Error rate thresholds
    MAX_ERROR_RATE = 0.01  # 1% error rate acceptable
    
    # Throughput requirements (requests per second)
    MIN_THROUGHPUT = 50
    
    @staticmethod
    def check_performance(metrics):
        """Validate if performance meets thresholds"""
        results = {
            'passed': True,
            'violations': []
        }
        
        for endpoint, response_time in metrics.get('response_times', {}).items():
            threshold = PerformanceThresholds.MAX_RESPONSE_TIME.get(
                endpoint, PerformanceThresholds.MAX_RESPONSE_TIME['read']
            )
            if response_time > threshold:
                results['passed'] = False
                results['violations'].append(
                    f"{endpoint}: {response_time}ms > {threshold}ms"
                )
        
        return results