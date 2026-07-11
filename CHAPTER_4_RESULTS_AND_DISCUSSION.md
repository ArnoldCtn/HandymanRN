# CHAPTER 4: RESULTS AND DISCUSSION

## 4.1 Results

### 4.1.1 Database Schema Implementation Results

The database schema was successfully implemented according to the design specifications outlined in Chapter 3. A total of twelve core database models were created across the Django applications, supporting the full range of platform functionality.

**User Management Models:**

The **User model** (backend/handyman/users/models.py) was implemented as an extension of Django's AbstractUser class, providing client account management with the following field results:

- **user_type:** CharField restricted to 'client' type, automatically assigned during user creation, enabling role-based differentiation
- **thumbnail:** ImageField for profile pictures, stored at media/thumbnails/{username}.{ext}
- **email:** CharField with unique constraint, successfully preventing duplicate account registration
- **is_online / last_seen:** BooleanField and DateTimeField for real-time presence tracking, updated through dedicated API endpoints
- **two_fa_enabled / two_fa_secret:** Two-factor authentication support fields, implemented but not enforced as mandatory

The model's mark_online() and mark_offline() methods were successfully implemented, updating the is_online status and last_seen timestamp on user login and logout events respectively.

The **PasswordResetOTP model** was implemented to support secure password recovery with the following features:
- Six-digit numeric OTP codes automatically generated on creation
- Five-minute expiration window enforced through datetime comparison
- Rate limiting implemented at the view level (maximum 3 OTP requests per hour per email)
- IP address and user agent tracking for security auditing
- Incrementing attempt counter with automatic lockout after 3 failed verification attempts

**Handyman Model:**

The **Handyman model** (backend/handyman/handymen/models.py) was implemented as a separate authentication identity extending AbstractBaseUser and PermissionsMixin, containing 25 fields organised into functional groups:

- **Identity fields:** username (unique), email (unique), phone, legal_name, birth_date, gender — all successfully storing handyman personal information
- **Verification fields:** id_number (unique), id_card_image, id_card_back_image, id_verification_status, id_verified_at — supporting the ID verification workflow with pending/verified/failed status tracking
- **Professional fields:** bio (text), availability (JSON for schedule), thumbnail (profile image) — enabling handyman profile customisation
- **Relationship fields:** ForeignKey to Location, ManyToMany to Service — enabling location assignment and service offering selection
- **Rating fields:** average_rating (DecimalField 1.00-10.00), total_ratings (PositiveIntegerField) — updated automatically through signal handlers
- **Status fields:** is_online, last_seen, is_available, is_verified, subscription_level (free/pro/premium) — controlling handyman visibility and feature access
- **Security fields:** two_fa_enabled, two_fa_secret — optional additional authentication layer

The **JobPicture model** was implemented to enable handymen to upload portfolio images of completed work, with images stored at media/job_pictures/{username}/{timestamp}.{ext} and ordered by most recent first.

**Service and Location Models:**

The **Service model** (backend/handyman/services/models.py) was implemented with name, description, image, created_by, and created_at fields. Services are created exclusively by administrators through the admin interface and are related to handymen through a ManyToMany relationship, enabling each handyman to offer multiple service types.

The **Location model** (backend/handyman/locations/models.py) was implemented with location name, region (defaulting to "West Region Cameroon"), and handyman_per_location tracking fields. Locations serve as the primary geographic filter for handyman discovery, associating each handyman with a specific area.

**Booking Model:**

The **Booking model** (backend/handyman/bookings/models.py) was implemented as the central transaction entity with the following state tracking architecture:

- **Relationship fields:** ForeignKeys to User (client), Handyman (service provider), Service, and Location — establishing complete booking context
- **Temporal fields:** scheduled_date (DateTime), created_at, updated_at, completed_at, cancelled_at — providing full lifecycle timestamping
- **Financial field:** total_amount (Decimal, max_digits=12, decimal_places=2) — storing agreed service price
- **Status field:** CharField with six choices (pending, accepted, declined, completed, cancelled, paid) — tracking booking progression
- **Descriptive fields:** job_description (TextField), cancellation_reason (Textfield)

The model implemented property methods **is_past** (checking if scheduled date has passed) and **can_be_cancelled** (restricting cancellation to pending or accepted status), enforcing business rules at the model level.

**Payment and Financial Models:**

The **Payment model** (backend/handyman/payments/models.py) was implemented with 22 fields supporting the complete payment lifecycle:

- **Amount structure:** gross_amount (total), platform_fee (30% default), handyman_amount (70% default) — with dynamic percentages based on handyman subscription level (premium=80/20, pro=75/25, free=70/30)
- **Payment method:** method field with MTN Money and Orange Money choices — supporting both major Cameroonian mobile money providers
- **Contact fields:** payer_number, handyman_payment_number — storing phone numbers for transaction processing
- **MeSomb references:** collect_ref, payout_ref — storing transaction identifiers for reconciliation
- **Status fields:** status (pending/collected/split/failed/refunded), collect_status, payout_status, handyman_withdrawal_status — providing granular transaction tracking
- **Admin withdrawal fields:** admin_withdrawal_requested, admin_withdrawal_amount, admin_withdrawal_number, admin_withdrawal_status — enabling platform fee extraction

The **Wallet model** was implemented with OneToOne relationships to both User and Handyman models, providing:
- balance (current available funds)
- total_earned_gross, total_earned_net, total_app_commissions (handyman earnings tracking)

The **Transaction model** was implemented with 10 fields supporting complete financial audit trails, including transaction type (credit/debit), status (pending/success/failed), and participant tracking fields.

**Communication and Quality Assurance Models:**

The **BookingMessage model** (backend/handyman/chats/models.py) was implemented with sender identification (sender_user or sender_handyman), message text, image attachment, and read status tracking. Messages are ordered by creation time within each booking conversation.

The **SupportConversation** and **SupportMessage models** were implemented to provide separate communication channels for user-admin and handyman-admin interactions, with admin identification flags and read status tracking.

The **Rating model** (backend/handyman/ratings/models.py) was implemented with 1-10 rating scale validation, review text field, and a unique_together constraint on user-handyman pairs, ensuring one rating per user-handyman combination.

### 4.1.2 API Endpoint Implementation Results

A total of 30+ REST API endpoints were successfully implemented across ten Django applications. Table 4.1 summarises the complete API surface.

**Table 4.1: Implemented API Endpoints**

| Application | Endpoint | Method | Purpose | Authentication |
|-------------|----------|--------|---------|----------------|
| **Users** | /users/signup/ | POST | Client registration | Public |
| | /users/signin/ | POST | Client login with lockout | Public |
| | /users/token/refresh/ | POST | JWT token refresh | Public |
| | /users/me/update/ | PATCH | Update client profile | JWT |
| | /users/me/online/ | POST | Mark client online | JWT |
| | /users/me/offline/ | POST | Mark client offline | JWT |
| | /users/password-reset/request/ | POST | Send password reset OTP | Public |
| | /users/password-reset/verify/ | POST | Verify OTP code | Public |
| | /users/password-reset/confirm/ | POST | Reset password | Public |
| **Handymen** | /handymen/signup/ | POST | Handyman registration | Public |
| | /handymen/signin/ | POST | Handyman login with lockout | Public |
| | /handymen/token/refresh/ | POST | Handyman token refresh | Public |
| | /handymen/verify-id/ | POST | Submit ID verification | Handyman JWT |
| | /handymen/profile/ | GET/PATCH | View/update handyman profile | Handyman JWT |
| | /handymen/me/online/ | POST | Mark handyman online | Handyman JWT |
| | /handymen/me/offline/ | POST | Mark handyman offline | Handyman JWT |
| | /handymen/available-services/ | GET | List available services | Public |
| | /handymen/available-locations/ | GET | List available locations | Public |
| | /handymen/by-service/{service_id}/ | GET | List handymen by service | Public |
| | /handymen/list/ | GET | List all verified handymen | Public |
| | /handymen/{id}/ | GET | Handyman detail view | Public |
| | /handymen/job-pictures/upload/ | POST | Upload job photo | Handyman JWT |
| | /handymen/job-pictures/{id}/ | DELETE | Delete job photo | Handyman JWT |
| **Services** | /services/ | GET | List all services | Public |
| **Bookings** | /bookings/ | GET/POST | List/create bookings | Dual JWT |
| | /bookings/{id}/ | GET | Booking detail | Dual JWT |
| | /bookings/{id}/respond/ | PATCH | Accept/decline/complete | Dual JWT |
| | /bookings/{id}/modify-price/ | PATCH | Modify booking amount | Dual JWT |
| **Payments** | /payments/wallet/ | GET | View wallet | Dual JWT |
| | /payments/transactions/ | GET | List transactions | Dual JWT |
| | /payments/webhooks/ | POST | MeSomb webhook | Public |
| **Chats** | /chats/booking/{id}/messages/ | GET | List chat messages | JWT |
| **Ratings** | /ratings/ | POST | Submit rating | JWT |
| | /ratings/handyman/{id}/ | GET | Handyman ratings | Public |
| **Notifications** | /notifications/ | GET | List notifications | JWT |
| | /notifications/{id}/read/ | POST | Mark as read | JWT |
| **Favourites** | /favorites/ | GET/POST | List/add favourites | JWT |
| | /favorites/{id}/ | DELETE | Remove favourite | JWT |

**DualJWTAuthentication Implementation:**
A custom authentication class, DualJWTAuthentication, was implemented to support both User (client) and Handyman authentication within the same view. This was necessary because the platform uses two separate user models with independent JWT token payloads. The authentication class attempts to validate tokens against both models, returning the appropriate authenticated user type. This enabled shared views (such as bookings and payments) to serve both client and handyman requests without requiring separate endpoints.

**Django Admin Interface:**
The Django admin interface was customised with the header "Handyman Platform Admin" and provided the following administrative capabilities:
- User management (view, activate/deactivate, filter)
- Handyman management (verify accounts, review ID documents, manage subscriptions)
- Service management (create, update, delete service categories)
- Booking monitoring (view all bookings, filter by status)
- Payment oversight (review transactions, process admin withdrawals)
- Location management (add/update service areas)
- Content management (ratings moderation, support conversations)

### 4.1.3 Authentication System Results

**Client Authentication:**
The client authentication system was implemented with the following results:

- **Registration:** The /users/signup/ endpoint accepts username, email, password, and optional thumbnail image. User creation automatically assigns user_type='client', generates JWT tokens, and returns authenticated user data. Validation enforces email uniqueness and password strength requirements.

- **Sign-In:** The /users/signin/ endpoint accepts username or email with password. The implementation resolves email to username if necessary, supports case-insensitive matching for emails, and returns JWT access (60-minute lifetime) and refresh (7-day lifetime) tokens on success.

- **Account Lockout:** The django-axes integration was successfully configured with a limit of 5 failed attempts and a 1-hour cooloff period. Lockout is enforced by username to prevent IP-based lockout in shared network environments. The sign-in endpoint returns status 429 with remaining minutes on locked accounts, 401 with remaining attempts on failed authentication.

- **Password Reset:** The three-step password reset workflow was successfully implemented:
  1. Request: Email submission triggers OTP generation and email delivery
  2. Verify: OTP verification with attempt counting (3 attempts before lockout) and 5-minute expiration
  3. Confirm: Password update with OTP validation, supporting both User and Handyman models

- **Presence Tracking:** The mark_online and mark_offline endpoints were successfully implemented, updating the is_online and last_seen fields on authenticated requests.

**Handyman Authentication:**
The handyman authentication system was implemented with parallel functionality:

- **Registration:** The /handymen/signup/ endpoint supports multipart form data for profile image upload during registration. Handyman creation generates separate JWT tokens with user_type='handyman' claim.

- **Sign-In:** A dedicated sign-in endpoint with handyman-specific password checking (using Handyman.check_password rather than Django's authenticate function, since Handyman is a separate model). The implementation signals Axes for brute force tracking on failed attempts.

- **Token Management:** Custom HandymanTokenRefreshView handles refresh token rotation for handyman tokens separately from client tokens.

- **ID Verification:** The /handymen/verify-id/ endpoint was successfully implemented with dual upload support:
  1. Multipart form data upload (image files)
  2. JSON with base64-encoded images
  
  The verification process extracts ID information, validates fields, stores images, and updates verification status. Upon successful verification, the handyman's id_verification_status is set to 'verified', is_verified is set to True, and the handyman becomes eligible to accept bookings and receive ratings.

### 4.1.4 Handyman Discovery and Service Browsing Results

**Service Browsing:**
The service listing system was implemented with the following results:

- The /services/ endpoint returns all available service categories (name, description, image) ordered by name. Services are created and managed by administrators through the Django admin interface.

- The /handymen/available-services/ endpoint provides the same service data for the handyman registration flow, enabling handymen to select their service offerings during profile setup.

**Handyman Listing:**
Multiple handyman discovery endpoints were implemented:

- **By Service:** /handymen/by-service/{service_id}/ filters handymen by service type, returning only active and verified handymen. The query uses select_related('location') and prefetch_related('services') for efficient database access.

- **Full listing:** /handymen/list/ returns all active, verified handymen with optional query parameters for min_rating and username search filtering.

- **Detail view:** /handymen/{id}/ returns comprehensive handyman information including profile, location, services, ratings, and job pictures.

- **Location listing:** /handymen/available-locations/ returns all available locations for handyman location assignment during registration.

**Rating System:**
The rating system was implemented with the following results:
- Users can submit ratings on a 1-10 scale with optional review text
- Unique constraint prevents duplicate ratings per user-handyman pair
- The Handyman model stores average_rating and total_ratings fields, updated through signal handlers
- The /ratings/handyman/{id}/ endpoint provides public access to handyman rating data

### 4.1.5 Booking Management System Results

The booking management system was successfully implemented with complete lifecycle management:

**Booking Creation:**
The /bookings/ POST endpoint accepts booking details including handyman ID, service ID, location ID, scheduled date, job description, and total amount. The BookingCreateSerializer validates input data and creates a booking with status='pending' linked to the authenticated user. The handyman assigned to the booking is the specified handyman from the request data.

**Booking Listing:**
The /bookings/ GET endpoint automatically filters bookings based on the authenticated user type:
- **Clients:** Return bookings where booking.user == authenticated user
- **Handymen:** Return bookings where booking.handyman == authenticated handyman

This dual-filtering was achieved through the DualJWTAuthentication class, which identifies whether the authenticated entity is a User or Handyman instance and filters the queryset accordingly.

**Booking Response:** 
The /bookings/{id}/respond/ PATCH endpoint implements three actions:

1. **Accept (action='accept'):** Restricted to the assigned handyman. Transitions booking status to 'accepted'. Returns 403 if a non-handyman or wrong handyman attempts acceptance.

2. **Decline (action='decline'):** Restricted to the assigned handyman. Transitions booking status to 'declined'. Stores optional cancellation reason.

3. **Complete (action='complete'):** Restricted to the client who created the booking. This action triggers the integrated payment system:
   - Validates payment provider and phone number
   - Calculates dynamic commission split based on handyman subscription level
   - Creates a Payment record with pending status
   - Initiates MeSomb payment collection in a background thread
   - Returns HTTP 202 Accepted immediately (asynchronous payment processing)

**Price Modification:**
The /bookings/{id}/modify-price/ PATCH endpoint enables clients to modify the total_amount of pending or accepted bookings, restricted to the booking owner.

**Status Transition Validation:**
The following state transitions are enforced at the API level:
- pending → accepted (handyman action)
- pending → declined (handyman action)  
- accepted → completed (client action, triggers payment)
- pending → cancelled (through deletion or manual update)
- accepted → cancelled (blocked by can_be_cancelled property)

### 4.1.6 Payment Processing Results

The payment processing system was successfully integrated with the MeSomb payment gateway:

**Payment Record Creation:**
When a client marks a booking as complete, a Payment record is created with the following automated calculations:

- **Standard (free subscription):** 70% to handyman, 30% platform fee
- **Pro subscription:** 75% to handyman, 25% platform fee
- **Premium subscription:** 80% to handyman, 20% platform fee

**MeSomb Integration:**
The MeSombService class (payments/services.py) was implemented with the following capabilities:

- **Payment Collection:** Initiates mobile money collection requests through MeSomb API. The collection request includes amount, payer phone number, service type (MTN/Orange), and booking reference.

- **Asynchronous Processing:** Payment collection runs in a background thread to avoid blocking the API response while waiting for the user's PIN entry on their mobile phone. The booking completion endpoint returns immediately with HTTP 202 Accepted.

- **Background Workflow:** The background thread:
  1. Calls MeSomb collect_payment API
  2. On success: updates payment status to 'collected', booking status to 'completed', stores collect_ref
  3. Initiates automatic payout to handyman through MeSomb
  4. On payout success: updates payment status to 'completed', handyman_withdrawal_status to 'completed'
  5. On failure: updates payment status to 'failed', stores error message

- **Webhook Handling:** The /payments/webhooks/ endpoint receives asynchronous status updates from MeSomb, processing transaction confirmations and updating payment records accordingly.

**Wallet System:**
The wallet system was successfully implemented with:

- Automatic wallet creation on first wallet query (get_or_create pattern)
- Wallet balance tracking for both users and handymen
- Handyman earnings tracking (total_earned_gross, total_earned_net, total_app_commissions)
- Paginated transaction history (10 transactions per page, configurable limit)

**Admin Financial Dashboard:**
The admin financial overview endpoint provides:
- Total gross transaction volume
- Total platform fees collected
- Total handyman payouts processed
- Admin withdrawal management through Django admin interface

### 4.1.7 Real-Time Communication Results

The real-time communication system was successfully implemented using Django Channels:

**WebSocket Configuration:**
The ASGI application was configured at handyman.asgi.application with Daphne as the ASGI server. The channel layer was configured as InMemoryChannelLayer for development, with Redis as the production upgrade path.

**Chat Functionality:**
The BookingMessage model stores chat messages linked to specific bookings. Each message tracks:
- Sender identity (sender_user or sender_handyman)
- Message content and optional image attachments
- Read status tracking
- Creation timestamp ordering

**Support Communication:**
The SupportConversation and SupportMessage models were implemented providing:
- Separate conversation threads for users and handymen
- Admin identification through is_from_admin flag
- Conversation status tracking (active/inactive)
- Read/unread status for support messages

**Presence Tracking:**
Online presence was successfully tracked through:
- mark_online() and mark_offline() methods on both User and Handyman models
- API endpoints for manual status updates
- Automatic is_online and last_seen field updates on authentication events

### 4.1.8 Mobile Application Implementation Results

The React Native mobile application was successfully implemented with the following structure:

**Navigation Architecture:**
The application implements a file-based routing system with three route groups:

1. **Unauthenticated routes:** Sign In, Sign Up, Forgot Password, Reset Password, Email Verification, Handyman Sign In, Handyman Sign Up
2. **Client authenticated routes:** Home, Search, Profile, Edit Profile, Bookings, Favourites, Notifications, Chat, Wallet, Handyman Profile View, Request Service
3. **Handyman authenticated routes:** Dashboard, Home, Bookings, Chats List, Profile, Edit Profile, Reviews, Job Pictures, Subscription, Verify ID, My Services, Favourited By

**Implemented Screens:**
The following screens were successfully implemented (20+ screens):

*Client Screens:*
- Splash screen (initial app loading)
- Sign In with username/password and optional PIN unlock
- Sign Up with profile creation
- Forgot/Reset Password via OTP
- Email Verification
- Home screen with service discovery
- Search with location-based handyman filtering
- Service listing by category
- Handyman profiles with ratings and job pictures
- Booking creation and management
- Booking detail with chat integration
- Favourites management
- Notifications list
- Real-time chat per booking
- Profile management with editing
- Wallet with balance and transactions
- PIN settings for enhanced security
- Support chat with administrators

*Handyman Screens:*
- Dashboard with earnings and booking summary
- Handyman Home with personalised content
- Service management (select offerings)
- Booking management (accept/decline)
- Chat list and per-booking messaging
- Profile management with verification
- Job picture upload and management
- Reviews and ratings view
- Subscription plan management
- ID verification submission
- Favourited by clients view
- Support chat with platform administrators

**Authentication Flow:**
The mobile application implements a complete authentication flow:
1. User enters credentials (username + password)
2. API call to /users/signin/ or /handymen/signin/
3. On success, JWT tokens stored in AsyncStorage
4. User profile stored in global state (useGlobal context)
5. Optional PIN lock verification before navigation
6. Token refresh handled by Axios interceptors on 401 responses
7. Navigation guard redirects unauthenticated users to sign-in

**Multi-Language Support:**
React i18next was integrated with translation files supporting:
- English (default)
- French
- Dynamic language switching through the application settings

**Location Integration:**
React Native Maps was integrated to display service locations, with Google Maps on Android and Apple Maps on iOS providing interactive map interfaces for handyman discovery.

**Real-Time Communication:**
Socket.io-client was integrated for WebSocket-based real-time chat, providing instant message delivery with automatic reconnection handling for network interruptions.

### 4.1.9 Administration and Monitoring Results

**Django Admin Interface:**
The customised Django admin interface provides:
- User management (view, search, filter, activate/deactivate)
- Handyman management (verify accounts, review documentation)
- Service CRUD operations
- Booking monitoring across all users
- Payment tracking and administration
- Location management
- Support conversation oversight

**Security Implementation:**
The following security measures were successfully implemented:
- JWT-based stateless authentication with access token rotation
- django-axes brute force protection (5 attempts, 1-hour lockout)
- Password hashing using Django's PBKDF2 algorithm
- Environment variable management for sensitive credentials
- Account deactivation capability for user termination
- Separate authentication flows for clients and handymen

---

## 4.2 Discussion

### 4.2.1 Achievement of Research Objectives

The HandymanWest development results demonstrate successful achievement of all four specific objectives defined in Chapter 1.

**Objective 1 — Requirements Analysis and System Architecture:**
The system architecture was successfully designed and implemented using Django REST Framework with PostgreSQL backend and React Native frontend. The three-tier architecture (presentation, application, data) provides clear separation of concerns, enabling independent scaling of each tier. The choice of PostgreSQL with PostGIS extension proved appropriate for location-based querying requirements. The implementation of 12 database models, 30+ API endpoints, and a component-based mobile frontend demonstrates comprehensive architectural realisation.

**Objective 2 — User Management and Authentication:**
The dual-user model architecture with separate User and Handyman authentication systems was successfully implemented. The JWT token-based authentication provides stateless, secure access control with configurable token lifetimes (60 minutes for access, 7 days for refresh). The brute force protection through django-axes effectively mitigates credential guessing attacks. The three-step password reset workflow with OTP verification provides secure account recovery. The ID verification workflow for handymen establishes a trust mechanism for service quality assurance.

**Objective 3 — Location-Based Services and Booking Management:**
The location-based handyman discovery system was successfully implemented through service and location filtering endpoints. The booking management system tracks the complete service lifecycle from creation through acceptance, completion, and payment. Status transition validation prevents invalid state changes. The dual-filtering mechanism in booking listing (client vs handyman perspectives) demonstrates thoughtful user experience design.

**Objective 4 — Payment Processing and Real-Time Communication:**
The MeSomb payment integration successfully enables mobile money transactions through MTN MoMo and Orange Money. The commission-based revenue model with dynamic percentages based on handyman subscription levels provides flexible monetisation. The asynchronous payment processing pattern (background thread with webhook callbacks) appropriately handles the synchronous PIN entry requirement of mobile money transactions. The Django Channels WebSocket implementation successfully provides real-time chat and presence tracking functionality.

### 4.2.2 Comparison with Existing Platforms

**Comparison with Global Platforms (TaskRabbit, Thumbtack):**
TaskRabbit and Thumbtack operate primarily in North American and European markets with established digital payment infrastructure, formal addressing systems, and comprehensive identity verification frameworks. HandymanWest differs in several important respects:

1. **Payment Infrastructure:** Unlike TaskRabbit's credit card processing, HandymanWest integrates with mobile money (MTN MoMo, Orange Money) which is the dominant digital payment method in Cameroon. The asynchronous payment workflow (initiate payment, await PIN entry, receive webhook confirmation) addresses the unique user experience requirements of mobile money transactions.

2. **Verification Flexibility:** Where Thumbtack requires formal business licences and insurance documentation, HandymanWest's ID verification system accepts government-issued identification documents, recognising that many handymen in the Cameroonian informal sector lack formal business registration. This accommodates the ILO (2021) finding that approximately 90% of employment in Cameroon is informal.

3. **Geographic Matching:** HandymanWest's location-based matching through predefined locations (rather than precise GPS coordinates) accommodates the informal addressing systems prevalent in the West Region, where street addresses and postal codes are not universally available.

**Comparison with African Platforms (SweepSouth, GetTrove):**
SweepSouth (South Africa) and GetTrove (South Africa) have demonstrated the viability of on-demand service platforms in African markets. HandymanWest extends this model in specific ways:

1. **Regional Focus:** Unlike the South African platforms' urban concentration, HandymanWest is specifically designed for the West Region of Cameroon, including smaller urban centres (Bafoussam, Dschang, Mbouda) and surrounding areas.

2. **Multi-Language Support:** HandymanWest's React i18next implementation provides French and English support, addressing the linguistic diversity of the West Region population — a feature not commonly documented in existing African platform research.

3. **Commission Model:** The dynamic commission structure based on subscription level (free 70/30, pro 75/25, premium 80/20) provides an incentive mechanism for handymen to invest in platform premium features, a refinement on the fixed commission models observed in SweepSouth and GetTrove.

4. **Wallet System:** The inclusion of digital wallet functionality for both users and handymen, with transaction history and balance management, provides financial tracking capabilities that support informal sector formalisation as discussed by Heeks (2002).

### 4.2.3 Strengths of the Implemented Solution

**Architectural Strengths:**

1. **Separation of Concerns:** The three-tier architecture with independent frontend and backend applications enables independent development, testing, and deployment. The API-first design allows the same backend to potentially serve web and mobile clients in the future.

2. **Scalability:** The Django Channels ASGI architecture supports horizontal scaling through Redis channel layers, while PostgreSQL with PostGIS provides efficient spatial querying. The stateless JWT authentication eliminates server-side session bottlenecks.

3. **Security:** The multi-layered security approach (JWT authentication, brute force protection, OTP verification, account lockout, environment variable management) provides defence-in-depth against common attack vectors. The dual-authentication model prevents cross-contamination between client and handyman credentials.

4. **Extensibility:** The modular Django application structure (10 apps) enables independent feature development. New functionality can be added as additional Django applications without modifying existing code.

**Functional Strengths:**

1. **Complete Service Lifecycle:** The platform manages the entire service transaction from discovery through payment, with integrated communication and quality assurance mechanisms.

2. **Role-Based Access:** The three-user-group model (client, handyman, admin) provides appropriate access control, with the Django admin interface offering comprehensive platform management capabilities.

3. **Offline-Capable Design:** The mobile application's token storage (AsyncStorage) and state management enable basic functionality even with intermittent connectivity, important in the variable network conditions of the West Region.

4. **Asynchronous Payments:** The background thread payment processing pattern appropriately handles the mobile money PIN entry requirement, providing responsive user experience while the payment awaits user confirmation.

### 4.2.4 Challenges Encountered

**Dual-User Model Complexity:**
The decision to implement separate User and Handyman models (rather than a single model with role field) introduced architectural complexity. The DualJWTAuthentication class was required to handle token validation across two models, and several views required type-checking (isinstance(user, Handyman)) to determine the authenticated user type. This increased code complexity compared to a unified user model approach.

**Asynchronous Payment Processing:**
The MeSomb payment integration presented challenges related to the synchronous nature of mobile money PIN entry. The solution of processing payments in a background thread with webhook callbacks introduced complexity in transaction state management. Race conditions between the background thread and webhook handler required careful implementation of status transition guards.

**Network Variability:**
Variable internet connectivity in the West Region required consideration in application design. Whilst the application does not implement full offline functionality, the asynchronous payment processing and token-based authentication partially address connectivity challenges. Full offline capability (cached service listings, queued booking operations) remains as future work.

**Informal Addressing:**
The absence of formal addressing systems in many areas of the West Region necessitated the location-based (rather than coordinate-based) matching approach. This simplification limits precision but ensures the platform remains usable for users without formal street addresses.

**Multi-Language Content:**
Implementing multi-language support required significant upfront investment in translation file management and UI layout adjustments. Maintaining translation consistency across the growing application codebase requires ongoing effort.

### 4.2.5 Limitations of the Current Implementation

1. **No Real-Time Location Tracking:** The current implementation matches handymen by predefined location rather than real-time GPS coordinates. This limits the precision of proximity-based matching for users needing immediate service.

2. **Limited Offline Functionality:** The mobile application requires internet connectivity for most operations. Full offline capability (cached data, queued operations, background sync) has not been implemented.

3. **Notification Reliability:** Whilst WebSocket-based real-time notifications are implemented, push notifications through Firebase Cloud Messaging require further testing to ensure reliable delivery when the application is in the background.

4. **Limited Payment Options:** The platform supports only MTN MoMo and Orange Money. Integration with other payment methods (bank transfers, credit cards, other mobile money providers) would expand accessibility.

5. **No Automated Scheduling:** The current booking system requires manual scheduling and confirmation. Automated scheduling with calendar integration and availability-based matching would improve efficiency.

6. **Limited Analytics:** The platform has basic financial reporting through the admin dashboard but lacks comprehensive analytics for user behaviour, service demand patterns, and platform performance metrics.

7. **No Rating Analytics:** While ratings and reviews are stored, the platform does not implement automated analysis for detecting suspicious rating patterns, review fraud, or rating manipulation.

8. **Single-Region Focus:** The platform is designed specifically for the West Region of Cameroon. Expansion to other regions would require additional location data and potential modifications to support multi-region operations.

### 4.2.6 Comparison with Literature Findings

The results of the HandymanWest project align with several findings from the literature reviewed in Chapter 2:

**On-Demand Service Platforms (Section 2.1):**
The successful implementation of service discovery, booking management, and quality assurance mechanisms confirms the Codagnone et al. (2016) finding that digital platforms reduce transaction costs and improve matching efficiency. However, the challenges encountered with mobile money integration and informal addressing support the observation that platform models must be adapted for developing market contexts.

**Mobile Application Development (Section 2.2):**
The cross-platform React Native implementation validated the Dalmasso et al. (2013) finding that cross-platform frameworks achieve significant development time savings with acceptable performance trade-offs for service marketplace applications. The Expo managed workflow reduced infrastructure complexity as documented by the Expo team (2023).

**Digital Marketplaces in Developing Economies (Section 2.3):**
The implementation confirmed the Friederici (2017) observation that successful African platforms must accommodate informal economic structures. The flexible ID verification system and mobile money integration reflect the platform's adaptation to the Cameroonian context. The importance of mobile money integration, identified by Jack and Suri (2014) and Mothobi and Grzybowski (2021), was a critical success factor in the payment system architecture.

**Trust and Quality Assurance (Section 2.4):**
The verification workflow, rating system, and review functionality implement the Gefen (2000) trust-building model through institutional structures (admin verification), technological infrastructure (JWT security), and relational factors (user reviews). The unique_together constraint on ratings implements the Forman et al. (2008) recommendation of verified purchase requirements to reduce fraudulent reviews.

**Technical Architecture (Section 2.5):**
The DRF-based API development confirmed the Brandl et al. (2016) finding that DRF's opinionated design patterns accelerate development. The PostgreSQL with PostGIS implementation demonstrated the spatial data capabilities documented by Güting (1994), though the location-based matching was simplified compared to the algorithms discussed by Ghosh and Krishnamoorthy (2019).

---

## 4.3 Chapter Summary

This chapter presented the results of the HandymanWest implementation and discussed their significance in relation to the research objectives and existing literature. The platform was successfully implemented with 12 database models, 30+ API endpoints, and 20+ mobile application screens across three user groups (clients, handymen, administrators).

The results demonstrate that a comprehensive handyman service marketplace can be effectively implemented using Django REST Framework and React Native, with the specific adaptations necessary for the Cameroonian context including mobile money integration, location-based matching, and multi-language support. The discussion highlighted the platform's strengths in addressing the identified research gaps, whilst acknowledging the challenges and limitations encountered.

The following chapter presents the conclusions drawn from this work and provides recommendations for future development and deployment.