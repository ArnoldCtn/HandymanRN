# HandymanWest — High-Level Architecture Diagram

> Only technologies actually implemented.  
> Excluded: Nginx, Gunicorn, Daphne, Redis, Firebase (not functional).

---

```mermaid
graph TB

    subgraph CLIENTS["CLIENT LAYER"]
        direction LR
        RN["React Native 0.81 + Expo SDK 54"]
        I18N["i18next (French / English)"]
        HTTP["Axios (REST)"]
        SOCK["Socket.io-client (WebSocket)"]
    end

    subgraph API["API LAYER"]
        DRF["Django REST Framework<br/>REST Endpoints"]
        CHANNELS["Django Channels<br/>WebSocket Server"]
        JWT["Simple JWT Auth<br/>+ django-axes Brute Force"]
    end

    subgraph DB["DATABASE LAYER"]
        PG[("PostgreSQL")]
    end

    subgraph EXT["EXTERNAL SERVICES"]
        M1["MeSomb<br/>MTN MoMo / Orange Money"]
        M2["Gemini 1.5 AI<br/>ID Document OCR"]
        M3["SMTP Email<br/>OTP Delivery"]
    end

    HTTP --->|"REST API (HTTPS)"| DRF
    SOCK --->|"WebSocket (wss://)"| CHANNELS
    DRF --> PG
    CHANNELS --> PG
    DRF ---> M1
    M1 --->|"Webhook"| DRF
    DRF ---> M2
    DRF ---> M3

    style CLIENTS fill:none,stroke:#333,stroke-width:3,color:#000
    style API fill:none,stroke:#333,stroke-width:3,color:#000
    style DB fill:none,stroke:#333,stroke-width:3,color:#000
    style EXT fill:none,stroke:#333,stroke-width:3,color:#000

    style RN fill:#61DAFB,color:#000,stroke:#000,font-size:16px,font-weight:bold
    style I18N fill:#E8F5E9,color:#000,stroke:#000,font-size:14px,font-weight:bold
    style HTTP fill:#E3F2FD,color:#000,stroke:#000,font-size:14px,font-weight:bold
    style SOCK fill:#F3E5F5,color:#000,stroke:#000,font-size:14px,font-weight:bold

    style DRF fill:#092E20,color:#FFF,stroke:#000,font-size:16px,font-weight:bold
    style CHANNELS fill:#092E20,color:#FFF,stroke:#000,font-size:14px,font-weight:bold
    style JWT fill:#1B5E20,color:#FFF,stroke:#000,font-size:13px,font-weight:bold

    style PG fill:#01579B,color:#FFF,stroke:#000,font-size:16px,font-weight:bold

    style M1 fill:#4A148C,color:#FFF,stroke:#000,font-size:14px,font-weight:bold
    style M2 fill:#1A237E,color:#FFF,stroke:#000,font-size:14px,font-weight:bold
    style M3 fill:#BF360C,color:#FFF,stroke:#000,font-size:14px,font-weight:bold
```

---

## Simplified Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP                              │
│  React Native + Expo (iOS & Android)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Client Features:  │  Handyman Features:             │   │
│  │ • Sign Up / Login  │  • Sign Up / Profile Setup     │   │
│  │ • Browse Services  │  • ID Verification (OCR)       │   │
│  │ • Search Handymen  │  • Accept / Decline Bookings   │   │
│  │ • Book a Service   │  • Dashboard & Earnings        │   │
│  │ • Pay via MeSomb   │  • Chat with Clients           │   │
│  │ • Rate & Review    │  • Wallet & History            │   │
│  │ • Chat with HM     │                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                              │                      │
│       │ REST API (HTTPS)             │ WebSocket (wss://)   │
│       ▼                              ▼                      │
│    Axios ──────────────────►  Socket.io-client             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   DJANGO BACKEND                            │
│  ┌──────────────────┐    ┌───────────────────────────┐     │
│  │ Django REST      │    │ Django Channels           │     │
│  │ Framework (DRF)  │    │ • Real-time Chat          │     │
│  │ • All API Routes │    │ • Online Status           │     │
│  │ • Auth (JWT)     │    └───────────────────────────┘     │
│  │ • Business Logic │                                       │
│  │ • Validation     │    ┌───────────────────────────┐     │
│  │ • django-axes    │    │ Django Apps (9)           │     │
│  └──────────────────┘    │ users, services, locations │     │
│                          │ bookings, payments, chats  │     │
│                          │ ratings, favorites, notifs │     │
│                          └───────────────────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Gemini  │ │   MeSomb     │
│  • All Data  │ │  AI API  │ │  Payment API │
│  • Users     │ │ • ID     │ │ • Collect    │
│  • Bookings  │ │   OCR    │ │ • Payout     │
│  • Payments  │ │ • Verify  │ │ • Webhook    │
│  • Messages  │ └──────────┘ └──────────────┘
│  • Ratings   │               ┌──────────────┐
│              │               │  SMTP Email  │
│              │               │  • OTP Codes │
│              │               │  • Notify    │
└──────────────┘               └──────────────┘
```

---

## Django Apps (9 total)

| App | Purpose |
|-----|---------|
| **users** | User & Handyman models, registration, login, OTP, PIN |
| **services** | Service categories (admin-managed) |
| **locations** | Geographic areas in West Region |
| **bookings** | Full lifecycle: pending → accepted → completed → paid |
| **payments** | MeSomb integration, wallets, commissions (70/30 split) |
| **chats** | Booking & support messaging |
| **ratings** | 1–10 reviews per user-handyman pair |
| **favorites** | Saved handymen |
| **notifications** | In-app alerts |

---

## Communication Summary

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Mobile App | Django REST Framework | HTTPS (REST) | All CRUD operations, auth, payments |
| Mobile App | Django Channels | WebSocket (wss) | Real-time chat, status updates |
| Django | PostgreSQL | TCP (SQL) | Data persistence |
| Django | MeSomb API | HTTPS | Collect mobile money, payout handymen |
| MeSomb | Django | Webhook | Transaction status callback |
| Django | Gemini AI API | HTTPS | ID document OCR & verification |
| Django | SMTP Email | SMTP | OTP codes, notifications |