# 3.2 Tools and Technology Definitions

## Frontend Technologies

### React Native 0.72 with Expo SDK 49

**Definition:**
React Native is an open-source mobile application framework developed by Meta (formerly Facebook) that enables developers to build native mobile applications for iOS and Android platforms using JavaScript and React. Unlike hybrid approaches that render content through WebViews, React Native compiles to native platform components, providing near-native performance and user experience.

**Expo SDK 49** is a managed workflow framework built on top of React Native that abstracts away much of the native development complexity. Expo provides a suite of pre-built tools, APIs, and services that streamline the mobile development lifecycle, including simplified build processes, over-the-air updates, and access to device hardware features without requiring manual native module configuration.

**Purpose in HandymanWest:**
React Native with Expo was selected to enable cross-platform deployment from a single codebase, eliminating the need to develop and maintain separate iOS and Android applications. This decision reflected the platform's need to reach the widest possible user base in the West Region of Cameroon, where both Android and iOS devices are in use, whilst minimising development time and maintenance overhead. The Expo managed workflow reduced infrastructure complexity, allowing the development team to focus on feature implementation rather than platform-specific configuration.

### TypeScript

**Definition:**
TypeScript is a statically-typed superset of JavaScript developed by Microsoft that adds optional type annotations to the language. TypeScript code is transpiled to standard JavaScript for execution, but the type system enables compile-time detection of type-related errors, improved code documentation through explicit type declarations, and enhanced IDE support including intelligent code completion, refactoring tools, and inline documentation.

**Purpose in HandymanWest:**
TypeScript was employed to improve code quality and developer productivity across the mobile application codebase. The type system served as living documentation, making the codebase more maintainable and reducing the likelihood of runtime errors that could negatively impact user experience. For a project of HandymanWest's complexity, involving multiple data models, API interactions, and state management requirements, TypeScript's type safety provided critical protection against common JavaScript pitfalls.

### Expo Router

**Definition:**
Expo Router is a file-based navigation library for React Native applications built with Expo. It adopts a routing paradigm similar to Next.js or Remix, where the file system structure directly maps to application routes. Each file in designated directory structures automatically becomes a navigable route, with nested directories creating nested navigation hierarchies.

**Purpose in HandymanWest:**
Expo Router was chosen to manage the application's complex navigation requirements, which included authenticated and unauthenticated route groups, tab navigation, stack navigation, and parameterised routes. The file-based routing approach simplified navigation configuration, making it easier to reason about the application's navigation structure. The framework's support for authentication guards and route groups enabled clear separation between the client, handyman, and shared sections of the application.

### React i18next

**Definition:**
React i18next is an internationalisation (i18n) framework for React applications, built on top of the i18next library. It provides a complete solution for translating application content into multiple languages, including text interpolation, pluralisation, date and number formatting, and language detection. The library supports lazy-loading of translation files, enabling efficient management of translated content.

**Purpose in HandymanWest:**
Multi-language support was a critical requirement for the West Region of Cameroon, where the population is linguistically diverse, speaking French, English, and various local languages. React i18next enabled the application to dynamically switch between languages, with all user-facing text stored in structured translation files. The library's interpolation capabilities allowed dynamic content (such as user names or numbers) to be embedded within translated strings, ensuring grammatically correct translations across languages.

### Axios

**Definition:**
Axios is a promise-based HTTP client for JavaScript applications that runs in both browser and Node.js environments. It provides a clean, chainable API for making HTTP requests, with features including automatic JSON data transformation, request and response interception, timeout configuration, and comprehensive error handling. Axios supports the full HTTP method spectrum (GET, POST, PUT, PATCH, DELETE) and can be configured with base URLs, headers, and authentication tokens.

**Purpose in HandymanWest:**
Axios served as the primary HTTP client for communication between the mobile application and the Django REST Framework backend. Its interceptor functionality was particularly valuable for implementing automatic JWT token refresh: when API requests returned 401 Unauthorised responses, interceptors could automatically attempt token refresh before retrying the original request, providing seamless authentication management. Axios's configurable base URL simplified environment-specific configuration (development, staging, production).

### AsyncStorage

**Definition:**
AsyncStorage is an asynchronous, persistent, key-value storage system for React Native applications. It provides a simple mechanism for storing small amounts of data on the device, persisting data across application restarts. Data stored in AsyncStorage is accessible only to the originating application, providing basic security isolation.

**Purpose in HandymanWest:**
AsyncStorage was used for local data persistence on mobile devices, primarily storing:
- **Authentication tokens:** JWT access and refresh tokens for maintaining login sessions
- **User profile data:** Cached user information for immediate availability on application launch
- **Application preferences:** Language selections, PIN configuration, and UI customisation settings

The library's asynchronous API prevented blocking the main UI thread during data read and write operations, maintaining application responsiveness.

### React Native Maps

**Definition:**
React Native Maps is a community-maintained wrapper library that provides a unified React Native interface for Google Maps on Android and Apple Maps on iOS. It offers declarative map components (MapView, Marker, Callout) alongside imperative APIs for programmatic map manipulation. The library handles platform-specific integration details, ensuring consistent map functionality across operating systems.

**Purpose in HandymanWest:**
React Native Maps was integrated to provide location visualisation and selection capabilities central to the platform's location-based service matching. The library rendered interactive maps displaying handyman locations, enabling clients to visualise service provider proximity. Map markers indicated handyman positions, with tap interactions providing detailed handyman information. The component's support for custom marker styling allowed differentiated display of handyman ratings, service types, and availability status.

### Socket.io-client

**Definition:**
Socket.io-client is the client-side library for Socket.IO, a real-time bidirectional communication library for web and mobile applications. Socket.IO provides WebSocket-based communication with automatic fallback to HTTP long-polling when WebSocket connections are unavailable. The client library manages connection lifecycle, including automatic reconnection with exponential backoff, event-based message handling, and room/namespace management for organised communication channels.

**Purpose in HandymanWest:**
Socket.io-client enabled real-time communication features on the mobile client, including:
- **Instant messaging:** Real-time delivery of chat messages between clients and handymen
- **Notification delivery:** Immediate receipt of booking status changes and platform notifications
- **Presence updates:** Real-time visibility of handyman online/offline status

The library's automatic reconnection capability was particularly important for maintaining communication reliability in the variable network conditions of the West Region of Cameroon.

---

## Backend Technologies

### Django 5.0 with Django REST Framework

**Definition:**
Django is a high-level Python web framework that follows the "batteries-included" philosophy, providing built-in components for common web development tasks including object-relational mapping (ORM), authentication, URL routing, template rendering, and database schema management. Django emphasises rapid development, security, and maintainability through its convention-over-configuration approach.

**Django REST Framework (DRF)** is a powerful and flexible toolkit for building Web APIs within Django applications. DRF provides serializers for data validation and transformation, viewset classes for implementing CRUD operations, authentication and permission classes for access control, and browsable API interfaces for developer testing. DRF follows Django's design patterns, maintaining consistency and reducing learning overhead for Django developers.

**Purpose in HandymanWest:**
Django was selected as the backend framework for its comprehensive feature set, strong security defaults, and mature ecosystem. The framework's built-in admin interface provided immediate functionality for platform administration, reducing development time for user management and content administration features. Django's ORM simplified database interactions, automatically generating SQL queries and managing schema migrations.

DRF extended Django's capabilities for API development, enabling rapid construction of RESTful endpoints for each platform feature. DRF's serialisation system handled the complex data transformations required by the platform's nested data models (booking details including user, handyman, service, and location information), whilst its viewset implementation patterns promoted code organisation and reusability.

### Python 3.11

**Definition:**
Python 3.11 is a major release of the Python programming language, introducing performance improvements through the Faster CPython project, new language features including exception groups and structural pattern matching, and enhanced error messages with precise error location indicators. Python 3.11 achieved approximately 10-60% performance improvements over Python 3.10 in benchmark testing.

**Purpose in HandymanWest:**
Python 3.11 served as the runtime environment for the entire backend system. The version's performance improvements directly benefited API response times and request handling capacity. The enhanced error messages and traceback improvements accelerated debugging during development, reducing time spent diagnosing code issues. Python's extensive ecosystem of libraries and community support provided access to the tools (DRF, Django Channels, PostgreSQL drivers) required for the platform's implementation.

### PostgreSQL 14 with PostGIS Extension

**Definition:**
PostgreSQL is a powerful, open-source object-relational database management system known for its reliability, feature richness, and extensibility. PostgreSQL supports advanced SQL functionality including ACID compliance, complex queries, foreign keys, triggers, views, and stored procedures. Version 14 introduced performance improvements for concurrent workloads, enhanced indexing capabilities, and improved JSON processing.

**PostGIS** is a spatial database extension for PostgreSQL that adds support for geographic objects, spatial functions, and spatial indexing. PostGIS enables storage and querying of location data (points, lines, polygons) using standard SQL syntax, with functions for distance calculation, area measurement, spatial relationship testing, and coordinate transformation. PostGIS follows the Simple Features for SQL specification from the Open Geospatial Consortium (OGC).

**Purpose in HandymanWest:**
PostgreSQL was selected as the primary database for its robust feature set, reliability, and suitability for transactional applications requiring data integrity. The database managed all persistent data including user accounts, profiles, service listings, bookings, payments, and messages. PostgreSQL's support for JSON fields accommodated flexible data structures such as handyman availability schedules.

The PostGIS extension was critical for implementing location-based service matching. Spatial indexes enabled efficient geographic queries, such as finding all verified handymen within a specified radius of a client's location. PostGIS functions calculated precise distances between coordinates, enabling accurate proximity-based ranking of search results.

### Django Channels 4.0

**Definition:**
Django Channels extends Django's capabilities beyond the traditional HTTP request-response cycle to handle WebSockets, chat protocols, and other asynchronous protocols. Channels introduces the concept of consumers (analogous to Django views but for WebSocket connections), channel layers for inter-process communication, and a routing system for protocol-specific connection handling. Channels operates at the ASGI (Asynchronous Server Gateway Interface) level, enabling Django to handle multiple protocol types simultaneously.

**Purpose in HandymanWest:**
Django Channels enabled the implementation of real-time features within the Django ecosystem, maintaining code consistency and utilising existing authentication, ORM, and session management systems. Channels consumers handled WebSocket connections for:
- Chat messaging between clients and handymen during booking processes
- Real-time notifications for booking status changes
- Support conversations with administrators

The channel layer mechanism facilitated message broadcasting to specific user groups, enabling efficient communication patterns without requiring external message queue infrastructure during development.

### Daphne ASGI Server

**Definition:**
Daphne is an ASGI (Asynchronous Server Gateway Interface) server developed as part of the Django Channels project. It serves as the interface between web servers and Python ASGI applications, handling both HTTP and WebSocket protocols. Daphne manages connection lifecycle, request routing to ASGI applications, and protocol-specific handling (HTTP request parsing, WebSocket frame encoding/decoding). It supports both synchronous and asynchronous ASGI applications.

**Purpose in HandymanWest:**
Daphne served as the production ASGI server for the HandymanWest backend, replacing the standard WSGI server (Gunicorn) for handling real-time communication alongside HTTP requests. Daphne's ability to handle both HTTP and WebSocket protocols through a single server eliminated the need for separate server infrastructure for different communication types. The server managed WebSocket connections, encoding and decoding WebSocket frames, and routing connections to appropriate Django Channels consumers based on the routing configuration.

### Simple JWT

**Definition:**
Simple JWT (JSON Web Token) is a Django REST Framework authentication library providing implementations of JWT-based authentication. JSON Web Tokens are an open standard (RFC 7519) that define a compact, URL-safe method for representing claims between parties. A JWT contains encoded JSON data including the user identifier, token expiration time, and custom claims, digitally signed to prevent tampering. Simple JWT implements token generation, validation, and refresh functionality with configurable token lifetimes and signing algorithms.

**Purpose in HandymanWest:**
Simple JWT provided stateless authentication for the HandymanWest API, eliminating the need for server-side session storage. The library's implementation followed established security best practices:
- **Access tokens** with 60-minute lifetimes limited the window of vulnerability for stolen tokens
- **Refresh tokens** with 7-day lifetimes enabled persistent login sessions without requiring repeated credential entry
- **Token rotation** invalidated old refresh tokens on each refresh, limiting token reuse
- **Custom claims** could embed user identification and role information for authorisation decisions

### django-allauth

**Definition:**
django-allauth is a Django application providing authentication, registration, and account management functionality. It implements local authentication (username/email and password) alongside social authentication providers. django-allauth handles the complete user account lifecycle including registration with email verification, login, password reset, and account management. The library provides configurable workflows, email templates, and security controls such as rate limiting and account protection.

**Purpose in HandymanWest:**
django-allauth managed user registration and authentication workflows, providing standardised, well-tested implementations of common account management functions. The library's email verification flow ensured that registered users provided valid email addresses, reducing fraudulent account creation. The password reset functionality provided secure token-based password recovery through email. Integration with Django's site framework and REST Framework connectors enabled seamless integration with the broader authentication architecture.

### django-axes

**Definition:**
django-axes is a Django application for monitoring and blocking malicious authentication attempts. It tracks login attempts, locking accounts when configurable thresholds are exceeded. Axes operates as middleware, intercepting authentication requests and checking against stored attempt records. It can be configured to lock by username, IP address, or combination, and supports configurable lockout durations and cooloff periods.

**Purpose in HandymanWest:**
django-axes was implemented to protect user accounts from brute force attacks, where attackers attempt to guess passwords through repeated automated login attempts. The configuration locked accounts after 5 failed login attempts within a 1-hour cooloff period, with locking based on username to prevent IP-based lockout in shared network environments (common in internet cafes and campus networks in Cameroon). The module also included reset-on-success functionality, clearing failed attempt records upon successful authentication.

### python-dotenv

**Definition:**
python-dotenv is a Python library that loads environment variables from .env files into the application's runtime environment. Environment variables are key-value pairs stored outside the application codebase, typically in a .env file placed in the project root directory. This approach separates configuration from code, enabling different configurations for development, testing, and production environments without modifying application source code.

**Purpose in HandymanWest:**
python-dotenv was used to manage sensitive configuration values including database credentials, API secrets, and environment-specific settings. The library loaded variables from a .env file (listed in .gitignore to prevent accidental commit to version control) into the Django settings module, keeping sensitive information out of the code repository. Environment variables managed included:
- DJANGO_SECRET_KEY: Django's cryptographic signing key
- DATABASE_URL: PostgreSQL connection string
- MESOMB_ACCESS_KEY, MESOMB_SECRET_KEY, MESOMB_APPLICATION_KEY: MeSomb payment API credentials
- MAIL_HOST, MAIL_PORT, MAIL_HOST_USER, MAIL_HOST_PASSWORD: Email server configuration
- GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET: OAuth client credentials

### MeSomb SDK

**Definition:**
MeSomb is a Cameroonian payment platform by Bee Corp Sarl that provides a unified API for mobile money collection and disbursement across multiple mobile network operators including MTN Mobile Money (MoMo) and Orange Money. The MeSomb SDK enables developers to integrate mobile money payments into their applications, supporting payment collection from users, automated payouts to service providers, transaction status checking via webhooks, and payment verification. MeSomb handles the technical integration with individual mobile money operators, providing a single integration point.

**Purpose in HandymanWest:**
The MeSomb SDK was the critical component enabling real-money transactions within the HandymanWest platform. Its capabilities were leveraged for:
- **Payment Collection:** Initiating requests to collect service fees from client mobile money accounts
- **Automated Payouts:** Distributing handyman earnings to their registered mobile money numbers
- **Webhook Integration:** Receiving asynchronous notifications about transaction status changes
- **Transaction Verification:** Confirming payment success through transaction reference lookup

The SDK's sandbox environment supported development and testing without real financial transactions, whilst the production environment processed live payments using MTN MoMo and Orange Money, the dominant mobile money providers in Cameroon. The platform commission model (30% platform fee, 70% handyman payout) was implemented through the SDK's split payment capabilities or through separate collection and payout transactions.

---

## Infrastructure Technologies

### Nginx

**Definition:**
Nginx (pronounced "engine-x") is a high-performance web server and reverse proxy server known for its stability, rich feature set, low resource consumption, and ability to handle large numbers of concurrent connections using an event-driven, asynchronous architecture. Beyond serving static content, Nginx can function as a reverse proxy, load balancer, HTTP cache, and TLS/SSL terminator. Its configuration is directive-based, supporting flexible request routing and processing rules.

**Purpose in HandymanWest:**
Nginx served as the production web server and reverse proxy, handling incoming HTTP and WebSocket connections and routing them to appropriate backend services:
- **Static File Serving:** Served Django's static files (CSS, JavaScript, admin media) directly, reducing backend load
- **Reverse Proxy:** Forwarded API requests to the Gunicorn WSGI server handling Django REST Framework endpoints
- **WebSocket Proxy:** Proxied WebSocket connections to the Daphne ASGI server for real-time communication
- **TLS/SSL Termination:** Handled HTTPS encryption and decryption, securing all API communications
- **Connection Management:** Managed connection pooling, request buffering, and timeout handling
- **Load Balancing:** Distributed traffic across multiple backend server instances in scaling scenarios

### Gunicorn

**Definition:**
Gunicorn (Green Unicorn) is a Python Web Server Gateway Interface (WSGI) HTTP server. It serves Python web applications by translating incoming HTTP requests into a standardised interface that Python web frameworks (including Django) can process. Gunicorn uses a pre-fork worker model, where a master process manages multiple worker processes that handle individual requests. It supports multiple worker types, including synchronous workers for simple applications and asynchronous workers (using various async frameworks) for applications requiring concurrent request handling.

**Purpose in HandymanWest:**
Gunicorn served as the WSGI server for handling standard HTTP API requests from the mobile application. It managed the Django REST Framework application process, handling request routing, worker lifecycle, and load distribution. Gunicorn's worker configuration was tuned for the expected request volume, balancing request throughput against server resource utilisation.

### Redis

**Definition:**
Redis (Remote Dictionary Server) is an open-source, in-memory data structure store that can function as a database, cache, and message broker. It supports various data structures including strings, hashes, lists, sets, sorted sets, and streams. Redis operates entirely in memory, providing sub-millisecond response times, with optional persistence to disk. Its publish/subscribe messaging pattern enables real-time message distribution to multiple subscribers.

**Purpose in HandymanWest:**
Redis served as the channel layer backend for Django Channels in production environments, enabling:
- **Inter-process communication:** Broadcasting WebSocket messages across multiple Daphne server instances
- **WebSocket scaling:** Maintaining channel groups (booking-specific, user-specific) for targeted message delivery
- **Message buffering:** Queuing messages for delivery to temporarily disconnected WebSocket clients
- **Session storage:** Optional caching of session data for improved performance

During development, the InMemoryChannelLayer provided equivalent functionality without Redis dependency, simplifying local development setup.

### PostgreSQL (Primary Database)

**Definition:**
As defined above in the Backend Technologies section, PostgreSQL is the primary relational database for the HandymanWest platform. In its infrastructure role, PostgreSQL is deployed as a persistent service, typically on dedicated server hardware or as a managed cloud database service. The database configuration includes performance tuning parameters (connection pooling, query caching, index management), backup strategies (automated regular backups with point-in-time recovery), and replication configuration for high availability.

**Purpose in HandymanWest:**
PostgreSQL stored all persistent platform data including user accounts, handyman profiles, service listings, booking records, payment transactions, wallet balances, chat messages, and ratings. The database was configured with appropriate data retention policies, backup schedules, and performance monitoring to ensure reliable operation. PostgreSQL's connection pooling managed the limited number of concurrent database connections from Gunicorn worker processes and Daphne server instances, preventing connection exhaustion under load.