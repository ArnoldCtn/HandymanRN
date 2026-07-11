# Password Reset OTP System - Implementation Guide

## Overview
This document describes the enhanced forgot password system with comprehensive OTP tracking, rate limiting, and security features.

## Features Implemented

### 1. Enhanced OTP Model (`PasswordResetOTP`)
The model now includes comprehensive tracking fields:

- **Core Fields:**
  - `email` - User's email address
  - `otp_code` - 6-digit OTP code
  - `expires_at` - OTP expiration timestamp (5 minutes)
  - `created_at` - Creation timestamp

- **Tracking Fields:**
  - `user_type` - Identifies if OTP is for 'user' or 'handyman'
  - `ip_address` - IP address of the request
  - `user_agent` - Browser/device information

- **Security Fields:**
  - `attempts` - Number of verification attempts
  - `max_attempts` - Maximum allowed attempts (default: 3)
  - `is_used` - Marks OTP as successfully verified
  - `verified_at` - Timestamp of successful verification

### 2. Rate Limiting
- **OTP Request Limit:** Maximum 3 OTP requests per hour per email
- **Verification Attempt Limit:** Maximum 3 attempts per OTP
- **Automatic Lockout:** OTP locks after exceeding max attempts

### 3. Security Features
- IP address tracking for all OTP requests
- User agent logging for device identification
- Attempt counting to prevent brute force attacks
- OTP locking mechanism
- Comprehensive audit trail

### 4. API Endpoints

#### POST `/api/users/password-reset/request/`
Request a password reset OTP.

**Request:**
```json
{
    "email": "user@example.com"
}
```

**Response (Success):**
```json
{
    "detail": "OTP sent successfully"
}
```

**Response (Rate Limited):**
```json
{
    "detail": "Too many OTP requests. Please try again in 1 hour."
}
```

**Response (Email Not Found):**
```json
{
    "detail": "This email does not exist."
}
```

#### POST `/api/users/password-reset/verify/`
Verify an OTP code.

**Request:**
```json
{
    "email": "user@example.com",
    "otp_code": "123456"
}
```

**Response (Success):**
```json
{
    "detail": "OTP verified successfully"
}
```

**Response (Invalid/Expired):**
```json
{
    "detail": "Invalid or expired OTP"
}
```

**Response (Locked):**
```json
{
    "detail": "Too many failed attempts. OTP locked. Please request a new one."
}
```

#### POST `/api/users/password-reset/confirm/`
Reset password with verified OTP.

**Request:**
```json
{
    "email": "user@example.com",
    "otp_code": "123456",
    "password": "newSecurePassword123"
}
```

**Response (Success):**
```json
{
    "detail": "Password updated successfully"
}
```

### 5. Management Command

Clean up expired and used OTPs:

```bash
# Dry run (see what would be deleted)
python manage.py cleanup_expired_otps --dry-run

# Actually delete expired OTPs
python manage.py cleanup_expired_otps
```

**Schedule with cron (Linux/Mac) or Task Scheduler (Windows):**
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/backend/handyman && python manage.py cleanup_expired_otps
```

### 6. Admin Interface

Access the Django admin to view and monitor OTPs:

**URL:** `/admin/users/passwordresetotp/`

**Features:**
- View all OTPs with tracking information
- Filter by user type, status, date
- Search by email, OTP code, or IP address
- See real-time status (expired, locked, active)
- Read-only access (prevents manual manipulation)

**Displayed Information:**
- Email address
- OTP code
- User type (User/Handyman)
- IP address
- User agent
- Attempts/Max attempts
- Status (Active/Expired/Locked)
- Timestamps (created, expires, verified)

## How It Works

### Flow Diagram

```
1. User requests password reset
   ↓
2. System checks rate limit (3/hour)
   ↓
3. System validates email exists (User or Handyman)
   ↓
4. System creates OTP with tracking data
   - Generates 6-digit code
   - Records IP address
   - Records user agent
   - Sets 5-minute expiration
   ↓
5. OTP sent via email (Gmail SMTP)
   ↓
6. User enters OTP on phone
   ↓
7. System verifies OTP
   - Checks if OTP exists and not expired
   - Checks if OTP is not locked
   - Increments attempt counter
   - Locks if max attempts reached
   ↓
8. If valid, OTP marked as used
   ↓
9. User sets new password
   ↓
10. Password updated and OTP marked as verified
```

### OTP Lifecycle

1. **Created:** OTP generated and stored with 5-minute expiry
2. **Active:** OTP can be verified (max 3 attempts)
3. **Used:** OTP successfully verified and password reset
4. **Expired:** OTP passed 5-minute validity
5. **Locked:** OTP locked after 3 failed verification attempts
6. **Cleaned:** OTP deleted after 24 hours (used/expired/locked)

## Security Considerations

### Implemented Protections:
1. **Rate Limiting:** Prevents OTP bombing attacks
2. **Attempt Tracking:** Detects and prevents brute force
3. **IP Logging:** Enables forensic analysis
4. **User Agent Logging:** Tracks devices/browsers
5. **OTP Locking:** Locks OTP after failed attempts
6. **Short Expiry:** 5-minute OTP validity
7. **One-Time Use:** OTP marked as used after verification

### Best Practices:
1. Monitor admin panel for suspicious patterns
2. Review locked OTPs regularly
3. Check rate limit logs for abuse
4. Run cleanup command regularly
5. Use HTTPS in production
6. Monitor email delivery rates

## Testing

### Manual Testing Steps:

1. **Test OTP Request:**
   ```bash
   curl -X POST http://localhost:8000/api/users/password-reset/request/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

2. **Test OTP Verification:**
   ```bash
   curl -X POST http://localhost:8000/api/users/password-reset/verify/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "otp_code": "123456"}'
   ```

3. **Test Password Reset:**
   ```bash
   curl -X POST http://localhost:8000/api/users/password-reset/confirm/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "otp_code": "123456", "password": "newPass123"}'
   ```

4. **Test Rate Limiting:**
   - Request OTP 4 times within an hour
   - 4th request should be rate limited

5. **Test Attempt Locking:**
   - Request OTP
   - Try wrong OTP 3 times
   - 4th attempt should be locked

## Database Schema

### PasswordResetOTP Table

```sql
CREATE TABLE users_passwordresetotp (
    id SERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    user_type VARCHAR(20) DEFAULT 'user',
    ip_address VARCHAR(45),
    user_agent TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_used BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP
);
```

## Troubleshooting

### OTP not received:
1. Check email configuration in `.env`
2. Verify Gmail SMTP settings
3. Check spam folder
4. Review Django logs for email errors

### OTP verification failing:
1. Check OTP hasn't expired (5 minutes)
2. Verify OTP hasn't been locked (3 failed attempts)
3. Ensure email matches exactly
4. Check OTP hasn't been used already

### Rate limit issues:
1. Wait 1 hour for rate limit to reset
2. Check admin panel for recent OTP requests
3. Review IP addresses for abuse patterns

## Maintenance

### Regular Tasks:
1. **Daily:** Run cleanup command to remove old OTPs
2. **Weekly:** Review admin panel for suspicious activity
3. **Monthly:** Audit rate limit logs and adjust if needed

### Cleanup Command Output:
```
DRY RUN: Would delete 150 expired/used OTPs
Breakdown:
  - Expired OTPs: 120
  - Used OTPs: 25
  - Locked OTPs: 5
```

## Future Enhancements

Potential improvements:
1. SMS OTP option
2. Push notification OTP
3. Biometric verification
4. Device fingerprinting
5. Anomaly detection
6. Email templates with branding
7. Multi-language support
8. OTP delivery method preferences