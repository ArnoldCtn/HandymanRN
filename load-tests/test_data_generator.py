"""
HandymanRN Test Data Generator
Generates realistic test data for load testing and demonstrations.
"""

import random
import string
from faker import Faker
import json

fake = Faker()


class TestDataGenerator:
    """Generate test data for scalability demonstrations"""
    
    @staticmethod
    def generate_user(user_type='client', count=1):
        """Generate test user(s)"""
        users = []
        for _ in range(count):
            user = {
                "email": fake.email(),
                "password": "TestPass123!",
                "first_name": fake.first_name(),
                "last_name": fake.last_name(),
                "user_type": user_type,
                "phone": f"+237{random.randint(600000000, 699999999)}"
            }
            users.append(user)
        return users[0] if count == 1 else users
    
    @staticmethod
    def generate_handyman(count=1):
        """Generate test handyman(s)"""
        handymen = []
        for _ in range(count):
            handyman = {
                "email": fake.email(),
                "password": "TestPass123!",
                "username": fake.user_name(),
                "phone": f"+237{random.randint(600000000, 699999999)}",
                "legal_name": fake.name(),
                "birth_date": fake.date_of_birth(minimum_age=21, maximum_age=65).isoformat(),
                "gender": random.choice(['male', 'female', 'other']),
                "bio": fake.text(max_nb_chars=200),
                "user_type": "handyman"
            }
            handymen.append(handyman)
        return handymen[0] if count == 1 else handymen
    
    @staticmethod
    def generate_booking(count=1):
        """Generate test booking(s)"""
        bookings = []
        for _ in range(count):
            booking = {
                "handyman_id": random.randint(1, 50),
                "service_id": random.randint(1, 20),
                "scheduled_date": fake.future_datetime(end_date='+30d').isoformat(),
                "description": fake.text(max_nb_chars=150),
                "total_amount": random.randint(5000, 100000),
                "location": fake.address()
            }
            bookings.append(booking)
        return bookings[0] if count == 1 else bookings
    
    @staticmethod
    def generate_service(count=1):
        """Generate test service(s)"""
        services = [
            "Plumbing", "Electrical", "Cleaning", "Painting", "Carpentry",
            "Masonry", "Roofing", "HVAC", "Landscaping", "Painting",
            "Welding", "Automotive", "Appliance Repair", "Moving", "Painting"
        ]
        
        service_data = []
        for _ in range(count):
            service = {
                "name": random.choice(services),
                "description": fake.text(max_nb_chars=200),
                "price_range": f"{random.randint(5000, 20000)} - {random.randint(50000, 200000)} XAF"
            }
            service_data.append(service)
        return service_data[0] if count == 1 else service_data
    
    @staticmethod
    def generate_bulk_users(client_count=100, handyman_count=20):
        """Generate bulk users for load testing"""
        clients = TestDataGenerator.generate_user('client', client_count)
        handymen = TestDataGenerator.generate_handyman(handyman_count)
        return {
            'clients': clients if isinstance(clients, list) else [clients],
            'handymen': handymen if isinstance(handymen, list) else [handymen]
        }
    
    @staticmethod
    def generate_test_scenario(scenario_name, user_count):
        """Generate complete test scenario configuration"""
        scenarios = {
            'light_load': {
                'users': 50,
                'spawn_rate': 5,
                'run_time': '5m',
                'description': 'Light load - normal weekday traffic'
            },
            'medium_load': {
                'users': 200,
                'spawn_rate': 10,
                'run_time': '10m',
                'description': 'Medium load - peak hours'
            },
            'heavy_load': {
                'users': 1000,
                'spawn_rate': 20,
                'run_time': '15m',
                'description': 'Heavy load - special promotion'
            },
            'stress_test': {
                'users': 5000,
                'spawn_rate': 50,
                'run_time': '30m',
                'description': 'Stress test - find breaking point'
            },
            'spike_test': {
                'users': 2000,
                'spawn_rate': 100,
                'run_time': '10m',
                'description': 'Spike test - viral marketing campaign'
            }
        }
        
        scenario = scenarios.get(scenario_name, scenarios['medium_load'])
        scenario['user_count'] = user_count
        return scenario
    
    @staticmethod
    def save_test_data(filename='test_data.json', count=100):
        """Save generated test data to file"""
        data = {
            'users': TestDataGenerator.generate_bulk_users(
                client_count=int(count * 0.8),
                handyman_count=int(count * 0.2)
            ),
            'bookings': TestDataGenerator.generate_booking(count // 10),
            'services': TestDataGenerator.generate_service(20)
        }
        
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ Test data saved to {filename}")
        return data


def main():
    """Generate and display sample test data"""
    print("=" * 60)
    print("HandymanRN Test Data Generator")
    print("=" * 60)
    
    # Generate sample data
    print("\n1. Sample Client User:")
    print(json.dumps(TestDataGenerator.generate_user('client'), indent=2))
    
    print("\n2. Sample Handyman:")
    print(json.dumps(TestDataGenerator.generate_handyman(), indent=2))
    
    print("\n3. Sample Booking:")
    print(json.dumps(TestDataGenerator.generate_booking(), indent=2))
    
    print("\n4. Test Scenarios:")
    for scenario_name in ['light_load', 'medium_load', 'heavy_load', 'stress_test']:
        print(f"\n{scenario_name}:")
        print(json.dumps(TestDataGenerator.generate_test_scenario(scenario_name, 100), indent=2))
    
    # Save bulk data
    print("\n5. Generating bulk test data...")
    TestDataGenerator.save_test_data('load-tests/test_data.json', count=200)


if __name__ == '__main__':
    main()