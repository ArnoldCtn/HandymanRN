# HandymanRN — UML Diagrams v2

## 1. Class Diagrams by User Role

### 1.1 User (Client) Perspective

```mermaid
classDiagram
    %% User and authentication
    class User {
        +String username
        +String email
        +String user_type
        +ImageField thumbnail
        +Boolean is_online
        +DateTime last_seen
        +Boolean two_fa_enabled
        +String two_fa_secret
    }

    class PasswordResetOTP {
        +String email
        +String otp_code
        +DateTime expires_at
        +String user_type
        +String ip_address
        +String user_agent
        +Integer attempts
        +Boolean is_used
    }

    %% Core business objects
    class Service {
        +String name
        +Text description
        +ImageField image
        +DateTime created_at
    }

    class Booking {
        +DateTime scheduled_date
        +Text job_description
        +Decimal total_amount
        +String status
        +DateTime completed_at
        +DateTime cancelled_at
        +Text cancellation_reason
        +DateTime created_at
    }

    class BookingMessage {
        +Text message
        +ImageField image
        +Boolean is_read
        +DateTime created_at
    }

    class SupportConversation {
        +Boolean is_active
        +DateTime created_at
        +DateTime updated_at
    }

    class SupportMessage {
        +Boolean is_from_admin
        +Text message
        +ImageField image
        +Boolean is_read
        +DateTime created_at
    }

    %% Payment and financial
    class Payment {
        +Decimal gross_amount
        +Decimal platform_fee
        +Decimal handyman_amount
        +String method
        +String payer_number
        +String collect_ref
        +String payout_ref
        +String status
        +Text error_message
        +DateTime created_at
    }

    class Wallet {
        +Decimal balance
        +Decimal total_earned_gross
        +Decimal total_earned_net
        +Decimal total_app_commissions
        +DateTime created_at
    }

    class Transaction {
        +Decimal amount
        +String transaction_type
        +String status
        +String description
        +DateTime created_at
    }

    %% Social features
    class Rating {
        +Integer rating
        +Text review
        +DateTime created_at
    }

    class Favorite {
        +DateTime created_at
    }

    class Notification {
        +String title
        +String body
        +String notification_type
        +Boolean is_read
        +DateTime created_at
    }

    %% Relationships - User as central entity
    User "1" --> "*" PasswordResetOTP : requests
    User "1" --> "*" Service : creates
    User "1" --> "*" Booking : creates
    User "1" --> "*" BookingMessage : sends
    User "1" --> "*" SupportConversation : participates
    User "1" --> "*" SupportMessage : sends
    User "1" --> "*" Payment : makes
    User "1" --> "1" Wallet : owns
    User "1" --> "*" Transaction : has
    User "1" --> "*" Rating : gives
    User "1" --> "*" Favorite : saves
    User "1" --> "*" Notification : receives

    %% Relationships between business objects
    Booking "1" --> "*" BookingMessage : contains
    Booking "1" --> "1" Payment : has
    Booking "1" --> "1" Notification : triggers

    SupportConversation "1" --> "*" SupportMessage : contains

    Wallet "1" --> "*" Transaction : contains
    Payment "1" --> "*" Transaction : generates
```

---

### 1.2 Handyman Perspective

```mermaid
classDiagram
    %% Handyman core profile
    class Handyman {
        +String username
        +String email
        +String phone
        +String legal_name
        +Date birth_date
        +String gender
        +String id_number
        +ImageField id_card_image
        +ImageField id_card_back_image
        +String id_verification_status
        +DateTime id_verified_at
        +Text bio
        +JSON availability
        +ImageField thumbnail
        +Decimal average_rating
        +Integer total_ratings
        +Boolean is_available
        +Boolean is_verified
        +String subscription_level
        +Boolean two_fa_enabled
        +String two_fa_secret
    }

    %% Handyman portfolio
    class JobPicture {
        +ImageField image
        +String description
        +DateTime created_at
    }

    %% Service and location
    class Service {
        +String name
        +Text description
        +ImageField image
        +DateTime created_at
    }

    class Location {
        +String location
        +String region
        +String handyman_per_location
        +DateTime created_at
    }

    %% Booking and communication
    class Booking {
        +DateTime scheduled_date
        +Text job_description
        +Decimal total_amount
        +String status
        +DateTime completed_at
        +DateTime cancelled_at
        +Text cancellation_reason
        +DateTime created_at
    }

    class BookingMessage {
        +Text message
        +ImageField image
        +Boolean is_read
        +DateTime created_at
    }

    class SupportConversation {
        +Boolean is_active
        +DateTime created_at
        +DateTime updated_at
    }

    class SupportMessage {
        +Boolean is_from_admin
        +Text message
        +ImageField image
        +Boolean is_read
        +DateTime created_at
    }

    %% Payment and financial
    class Payment {
        +Decimal gross_amount
        +Decimal platform_fee
        +Decimal handyman_amount
        +String method
        +String handyman_payment_number
        +String collect_ref
        +String payout_ref
        +String handyman_withdrawal_status
        +Boolean admin_withdrawal_requested
        +String status
        +Text error_message
        +DateTime created_at
    }

    class Wallet {
        +Decimal balance
        +Decimal total_earned_gross
        +Decimal total_earned_net
        +Decimal total_app_commissions
        +DateTime created_at
    }

    class Transaction {
        +Decimal amount
        +String transaction_type
        +String status
        +String description
        +DateTime created_at
    }

    %% Social features
    class Rating {
        +Integer rating
        +Text review
        +DateTime created_at
    }

    class Favorite {
        +DateTime created_at
    }

    class Notification {
        +String title
        +String body
        +String notification_type
        +Boolean is_read
        +DateTime created_at
    }

    class Subscription {
        +String plan
        +Decimal price
        +Duration duration
        +DateTime created_at
    }

    %% Relationships - Handyman as central entity
    Handyman "1" --> "*" JobPicture : has
    Handyman "*" --> "*" Service : provides
    Handyman "1" --> "1" Location : works at
    Handyman "1" --> "*" Booking : assigned to
    Handyman "1" --> "*" BookingMessage : sends
    Handyman "1" --> "*" SupportConversation : participates
    Handyman "1" --> "*" SupportMessage : sends
    Handyman "1" --> "*" Payment : receives
    Handyman "1" --> "1" Wallet : owns
    Handyman "1" --> "*" Transaction : has
    Handyman "1" --> "*" Rating : receives
    Handyman "1" --> "*" Favorite : saved by
    Handyman "1" --> "*" Notification : receives
    Handyman "1" --> "1" Subscription : has

    %% Relationships between business objects
    Booking "1" --> "*" BookingMessage : contains
    Booking "1" --> "1" Payment : has
    Booking "1" --> "1" Notification : triggers

    SupportConversation "1" --> "*" SupportMessage : contains

    Wallet "1" --> "*" Transaction : contains
    Payment "1" --> "*" Transaction : generates
```

---

### 1.3 Admin Perspective

```mermaid
classDiagram
    %% Admin user
    class User {
        +String username
        +String email
        +Boolean is_staff
        +Boolean is_superuser
    }

    %% Managed entities
    class Handyman {
        +String username
        +String email
        +String phone
        +String legal_name
        +String id_verification_status
        +Boolean is_verified
        +String subscription_level
    }

    class Service {
        +String name
        +Text description
        +DateTime created_at
    }

    class Location {
        +String location
        +String region
        +DateTime created_at
    }

    class Booking {
        +DateTime scheduled_date
        +Decimal total_amount
        +String status
        +DateTime created_at
    }

    class Rating {
        +Integer rating
        +Text review
        +DateTime created_at
    }

    %% Support and communication
    class SupportConversation {
        +Boolean is_active
        +DateTime created_at
        +DateTime updated_at
    }

    class SupportMessage {
        +Boolean is_from_admin
        +Text message
        +ImageField image
        +Boolean is_read
        +DateTime created_at
    }

    class Notification {
        +String title
        +String body
        +String notification_type
        +Boolean is_read
        +DateTime created_at
    }

    %% Payment management
    class Payment {
        +Decimal gross_amount
        +Decimal platform_fee
        +Decimal handyman_amount
        +String method
        +String status
        +Boolean admin_withdrawal_requested
        +Decimal admin_withdrawal_amount
        +String admin_withdrawal_number
        +String admin_withdrawal_status
        +DateTime created_at
    }

    %% Relationships - Admin as central entity
    User "1" --> "*" SupportConversation : manages
    User "1" --> "*" SupportMessage : sends
    User "1" --> "*" Notification : sends
    User "1" --> "*" Payment : manages withdrawals
    User "1" --> "*" Service : manages
    User "1" --> "*" Location : manages
    User "1" --> "*" Rating : moderates

    %% Admin views/manages these entities
    User "1" --> "*" Handyman : verifies
    User "1" --> "*" Booking : monitors

    %% Relationships between entities
    Handyman "1" --> "*" SupportConversation : participates
    Handyman "1" --> "*" SupportMessage : sends
    Handyman "1" --> "*" Notification : receives
    Handyman "1" --> "*" Payment : monitors
    Handyman "1" --> "*" Booking : views
    Handyman "1" --> "*" Rating : moderates

    SupportConversation "1" --> "*" SupportMessage : contains

    Booking "1" --> "*" Notification : triggers
    Booking "1" --> "1" Payment : has
```

---

## 2. Use Case Diagram — Booking & Payment System

```mermaid
usecaseDiagram
    actor "User (Client)" as client
    actor "Handyman" as handyman
    actor "Admin" as admin
    actor "MeSomb Payment" as mesomb

    rectangle "Authentication" {
        client --> (Register)
        client --> (Login)
        client --> (Reset Password via OTP)
        client --> (Enable 2FA)
        handyman --> (Register)
        handyman --> (Login)
        handyman --> (Reset Password via OTP)
        handyman --> (Upload ID Card)
    }

    rectangle "Service Discovery" {
        client --> (Browse Services)
        client --> (Search Handymen)
        client --> (View Handyman Profile)
        client --> (View Job Portfolio)
        client --> (Save to Favorites)
    }

    rectangle "Booking Management" {
        client --> (Create Booking)
        client --> (Modify Booking Price)
        client --> (Cancel Booking)
        client --> (Mark as Complete)
        handyman --> (Accept Booking)
        handyman --> (Decline Booking)
    }

    rectangle "Payment Processing" {
        client --> (Pay via MTN Money)
        client --> (Pay via Orange Money)
        mesomb --> (Collect Payment)
        mesomb --> (Process Payout)
        handyman --> (Receive Payment)
        admin --> (View Platform Revenue)
        admin --> (Process Admin Withdrawal)
    }

    rectangle "Rating & Reviews" {
        client --> (Rate Handyman 1-10)
        client --> (Write Review)
        handyman --> (View Ratings)
    }

    rectangle "Communication" {
        client --> (Send Booking Message)
        handyman --> (Send Booking Message)
        client --> (Contact Support)
        handyman --> (Contact Support)
        admin --> (Reply to Support)
    }

    rectangle "Notifications" {
        client --> (Receive Notifications)
        handyman --> (Receive Notifications)
        admin --> (Send Notifications)
    }

    rectangle "Handyman Profile" {
        handyman --> (Set Availability)
        handyman --> (Upload Job Pictures)
        handyman --> (Subscribe to Plan)
    }
```

---

## 3. Sequence Diagrams

### 3.1 Booking Creation & Acceptance Flow

```mermaid
sequenceDiagram
    actor Client
    participant API as Django REST API
    participant DB as Database
    participant WS as WebSocket
    participant Handyman

    Client->>API: POST /api/bookings/
    Note over Client,API: {service, location, scheduled_date, job_description}
    API->>DB: Create Booking (status=pending)
    DB-->>API: Booking ID
    API-->>Client: 201 Created (Booking details)

    API->>WS: Emit "new_booking" to handyman
    WS-->>Handyman: Real-time notification

    Handyman->>API: PATCH /api/bookings/{id}/
    Note over Handyman,API: {action: "accept"}
    API->>DB: Update status=accepted
    DB-->>API: Updated booking
    API-->>Handyman: 200 OK

    API->>WS: Emit "booking_accepted" to client
    WS-->>Client: Real-time notification
```

### 3.2 Payment Collection & Payout Flow

```mermaid
sequenceDiagram
    actor Client
    participant API as Django REST API
    participant DB as Database
    participant MeSomb as MeSomb Payment Gateway
    participant HandymanWallet as Handyman Wallet

    Client->>API: PATCH /api/bookings/{id}/
    Note over Client,API: {action: "complete", payment_provider, payment_number}
    API->>DB: Create Payment (status=pending)
    API->>DB: Create Wallet if not exists
    API-->>Client: 202 Accepted (Check phone for PIN)

    API->>MeSomb: collect_payment(amount, phone, service)
    MeSomb-->>Client: SMS with PIN prompt
    Client->>MeSomb: Enter PIN on phone

    MeSomb->>API: Webhook: payment.success
    API->>DB: Update Payment (status=collected, collect_ref)
    API->>DB: Create Transaction (credit to client wallet)

    API->>MeSomb: process_automatic_payout(payment)
    MeSomb->>HandymanWallet: Transfer funds (70% - platform fee)
    MeSomb-->>API: Payout success (payout_ref)
    API->>DB: Update Payment (status=split)
    API->>DB: Create Transaction (debit from platform, credit to handyman)
    API->>DB: Update Handyman Wallet balance

    API->>API: Trigger Notification to both parties
```

### 3.3 Authentication & OTP Flow

```mermaid
sequenceDiagram
    actor User
    participant API as Django REST API
    participant DB as Database
    participant Email as Email Service

    User->>API: POST /api/auth/login/
    Note over User,API: {username, password}
    API->>DB: Validate credentials
    alt Invalid credentials
        DB-->>API: AuthenticationFailed
        API-->>User: 401 Unauthorized
    else Valid credentials
        DB-->>API: User object
        API-->>User: 200 OK (JWT Access + Refresh tokens)
    end

    User->>API: POST /api/auth/password-reset/
    Note over User,API: {email}
    API->>DB: Create PasswordResetOTP (6-digit code, expires=5min)
    API->>Email: Send OTP to email
    Email-->>User: Email with OTP code

    User->>API: POST /api/auth/password-reset/verify/
    Note over User,API: {email, otp_code, new_password}
    API->>DB: Validate OTP (check expiry, attempts)
    alt Invalid OTP
        DB-->>API: Increment attempts
        API-->>User: 400 Invalid OTP
    else Valid OTP
        API->>DB: Mark OTP as used
        API->>DB: Update user password
        API-->>User: 200 Password reset successful
    end
```

### 3.4 Chat Messaging Flow (WebSocket)

```mermaid
sequenceDiagram
    actor Client
    participant WS as WebSocket (Channels)
    participant DB as Database
    participant Handyman

    Client->>WS: Connect to ws://.../ws/chat/{booking_id}/
    WS->>DB: Validate booking access
    DB-->>WS: Authorized
    WS-->>Client: Connection accepted

    Client->>WS: Send message
    Note over Client,WS: {message: "When can you come?"}
    WS->>DB: Save BookingMessage
    DB-->>WS: Message saved
    WS-->>Client: Message delivered

    par Parallel broadcast
        WS->>Handyman: Push message via WebSocket
        Handyman-->>WS: Read receipt
        WS->>DB: Update is_read=True
    end

    Handyman->>WS: Send reply
    Note over Handyman,WS: {message: "Tomorrow at 2pm"}
    WS->>DB: Save BookingMessage
    WS-->>Client: Push reply via WebSocket
    Client-->>WS: Read receipt
```

---

## 4. Deployment Architecture Diagram

```mermaid
graph TB
    subgraph "Client Side"
        MobileApp[React Native Mobile App]
    end

    subgraph "Backend (Django)"
        API[REST API - Django REST Framework]
        WS[WebSocket - Django Channels]
        Auth[JWT Authentication]
        DB[(PostgreSQL/SQLite)]
        Media[Media Storage]
    end

    subgraph "External Services"
        Firebase[Firebase Admin SDK]
        MeSomb[MeSomb Payment Gateway]
        Email[SMTP Email Service]
    end

    MobileApp -->|HTTPS| API
    MobileApp -->|WebSocket| WS
    API --> Auth
    API --> DB
    WS --> DB
    API --> Media
    API --> Firebase
    API --> MeSomb
    API --> Email
    MeSomb -->|Webhook| API
```

---

## How to Use These Diagrams

### In GitHub Markdown (auto-renders):
Just paste the code blocks above into any `.md` file. GitHub will render them automatically.

### In VS Code:
1. Install extension: **"Markdown Preview Mermaid Support"**
2. Open this file
3. Press `Ctrl+Shift+V` to preview

### In Your Thesis/Document:
1. Use the **draw.io** VS Code extension to recreate these diagrams visually
2. Or use **PlantUML** with the same syntax (Mermaid and PlantUML are very similar)
3. Export as PNG/SVG and embed in your Word/LaTeX document

### For Presentations:
- Copy the Mermaid code into https://mermaid.live/
- Export as SVG/PNG
- Insert into PowerPoint/Google Slides