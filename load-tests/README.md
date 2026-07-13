# HandymanRN Scalability Load Testing

This directory contains tools to demonstrate the scalability and performance limits of the HandymanRN application.

## 📋 Prerequisites

- Python 3.8 or higher
- Backend server running on `http://localhost:8000`
- Internet connection (only for initial setup - ~1GB download)

## 🚀 Quick Start

### Option 1: Windows (Easy - Double Click)
```bash
# Just double-click this file:
run_tests.bat
```

### Option 2: Manual Setup (All Platforms)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start your backend server** (if not already running):
   ```bash
   # In the backend directory:
   cd backend
   python manage.py runserver
   ```

3. **Run load tests:**
   ```bash
   # Light load test (recommended for first test)
   locust -f locustfile.py --headless -u 50 -r 5 --run-time 5m --host http://localhost:8000
   
   # Or use the web UI for interactive testing:
   locust -f locustfile.py --host http://localhost:8000
   # Then open http://localhost:8089
   ```

## 📊 Test Scenarios

| Scenario | Users | Duration | Purpose |
|----------|-------|----------|---------|
| **Light Load** | 50 | 5 min | Normal weekday traffic |
| **Medium Load** | 200 | 10 min | Peak hours |
| **Heavy Load** | 1000 | 15 min | Special promotion |
| **Stress Test** | 5000 | 30 min | Find breaking point |
| **Spike Test** | 2000 | 10 min | Viral marketing campaign |

## 📈 What Gets Tested

### User Behaviors Simulated:
- **Client Actions (80%)**: Browse services, view handymen, create bookings, check wallet
- **Handyman Actions (15%)**: View available jobs, toggle online status, check earnings
- **Admin Actions (5%)**: View dashboard, check verifications

### API Endpoints Tested:
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User authentication
- `GET /api/services/` - Service listings
- `GET /api/handymen/` - Handyman listings
- `GET /api/handymen/{id}/` - Handyman profiles
- `GET /api/services/?search={term}` - Service search
- `GET /api/bookings/` - User bookings
- `POST /api/bookings/` - Create booking
- `GET /api/notifications/` - Notifications
- `GET /api/wallet/` - Wallet balance
- `GET /api/admin/dashboard/` - Admin dashboard
- `GET /api/handyman/available-jobs/` - Available jobs

## 📊 Understanding Results

### Key Metrics to Watch:

1. **Response Time (ms)**
   - ✅ Good: < 500ms
   - ⚠️  Warning: 500-1000ms
   - ❌ Critical: > 1000ms

2. **Requests Per Second (RPS)**
   - Higher is better
   - Shows how many concurrent operations your system can handle

3. **Failure Rate**
   - ✅ Good: < 1%
   - ⚠️  Warning: 1-5%
   - ❌ Critical: > 5%

4. **Concurrent Users**
   - The maximum number of users before performance degrades

### HTML Reports

After each test, an HTML report is generated:
- `report_light_load.html`
- `report_medium_load.html`
- `report_heavy_load.html`
- `report_stress_test.html`
- `report_spike_test.html`
- `report_custom.html`

Open these in a browser to see:
- Response time graphs
- Request/response statistics
- Failure analysis
- Performance trends

## 🎯 Demonstrating Scalability

### Step-by-Step Demo Script:

1. **Start with Light Load (50 users)**
   ```bash
   # Run the test
   locust -f locustfile.py --headless -u 50 -r 5 --run-time 5m --host http://localhost:8000 --html demo_50_users.html
   ```
   - Show the report: "Our system handles 50 concurrent users easily"

2. **Medium Load (200 users)**
   ```bash
   locust -f locustfile.py --headless -u 200 -r 10 --run-time 10m --host http://localhost:8000 --html demo_200_users.html
   ```
   - Show metrics: "Still performing well at 200 users"

3. **Heavy Load (1000 users)**
   ```bash
   locust -f locustfile.py --headless -u 1000 -r 20 --run-time 15m --host http://localhost:8000 --html demo_1000_users.html
   ```
   - Highlight: "Handling 1000+ concurrent users!"

4. **Stress Test (5000 users) - Find the Limit**
   ```bash
   locust -f locustfile.py --headless -u 5000 -r 50 --run-time 30m --host http://localhost:8000 --html demo_stress_test.html
   ```
   - Show breaking point: "System starts to degrade at X users"
   - This demonstrates the **limit** of your current setup

## 📝 Test Data Generator

Generate test data for demos:

```bash
python test_data_generator.py
```

This creates:
- Sample users (clients and handymen)
- Sample bookings
- Test scenarios configuration
- `test_data.json` file with bulk data

## 🔧 Customization

### Modify Test Behavior:

Edit `locustfile.py` to:
- Add more API endpoints
- Change user behavior patterns
- Adjust task weights
- Add authentication headers

### Example: Add authenticated requests

```python
def on_start(self):
    # Login and store token
    response = self.client.post("/api/auth/login/", json={
        "email": "test@example.com",
        "password": "TestPass123!"
    })
    self.token = response.json().get('access_token')
    
def view_protected_resource(self):
    # Use token in headers
    self.client.get(
        "/api/protected/",
        headers={"Authorization": f"Bearer {self.token}"}
    )
```

## 📊 Performance Baselines

Expected performance on a modern laptop (16GB RAM, SSD):

| Users | Avg Response Time | RPS | Status |
|-------|------------------|-----|--------|
| 50 | < 200ms | 50+ | ✅ Excellent |
| 200 | < 300ms | 100+ | ✅ Good |
| 1000 | < 500ms | 200+ | ⚠️  Acceptable |
| 5000 | > 1000ms | 100+ | ❌ Degraded |

*Your actual performance will vary based on hardware and database optimization*

## 🎓 What This Demonstrates

### To Stakeholders:

1. **Current Capacity**: "Our app handles X concurrent users"
2. **Performance**: "Average response time is X ms under Y load"
3. **Breaking Point**: "System starts degrading at X users"
4. **Scalability Path**: "To handle 10x more users, we need to..."

### Scaling Recommendations (Based on Results):

**If performance degrades at 1000 users:**
- Add database indexes
- Implement Redis caching
- Use database connection pooling
- Add a CDN for static files

**If performance degrades at 5000 users:**
- Deploy multiple backend instances (load balancer)
- Use PostgreSQL read replicas
- Implement database sharding
- Add message queue (Celery) for async tasks

**If performance degrades at 10000+ users:**
- Microservices architecture
- Distributed caching (Redis Cluster)
- Database partitioning
- CDN for API responses

## 🐛 Troubleshooting

### Backend not detected:
```bash
# Make sure backend is running:
cd backend
python manage.py runserver
```

### Connection refused:
```bash
# Check if port 8000 is available:
netstat -ano | findstr :8000
```

### High failure rate:
- Check backend logs for errors
- Verify database is running
- Check if you have enough database connections

## 📚 Additional Resources

- [Locust Documentation](https://docs.locust.io/)
- [Performance Testing Guide](https://docs.locust.io/en/stable/what-is-locust.html)
- [Django Scalability](https://docs.djangoproject.com/en/stable/topics/db/optimization/)

## 🎯 Next Steps

After load testing:
1. Analyze bottlenecks in the reports
2. Optimize database queries
3. Add caching where needed
4. Test again to measure improvement
5. Document the scalability improvements