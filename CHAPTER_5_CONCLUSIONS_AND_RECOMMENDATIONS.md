# CHAPTER 5: CONCLUSIONS AND RECOMMENDATIONS

## 5.1 Conclusions

### 5.1.1 Summary of the Project

This project set out to address the persistent difficulty experienced by residents and businesses in the West Region of Cameroon in locating reliable, qualified, and affordable handyman services through efficient and transparent channels. The traditional methods of finding handymen—relying on personal networks, physical searches, and word-of-mouth referrals—were identified as inefficient, unreliable, and particularly problematic for newcomers to the region lacking established local connections. Simultaneously, skilled handymen and tradespeople faced challenges in accessing consistent work opportunities and reaching potential clients beyond their immediate social circles.

The HandymanWest mobile application was successfully developed to bridge this gap between service seekers and qualified service providers. The platform was architected using a three-tier system comprising a React Native with Expo mobile frontend, a Django REST Framework backend, and a PostgreSQL with PostGIS database. The development process incorporated comprehensive user authentication, location-based service matching, real-time communication, secure mobile money payment processing, and quality assurance mechanisms across all platform features.

### 5.1.2 Achievement of Project Objectives

**Overall Objective:**
The overall objective—to design, develop, and deploy a fully functional mobile application connecting clients seeking handyman services with qualified service providers in the West Region of Cameroon through a secure, location-aware digital marketplace—was successfully achieved. HandymanWest exists as a complete, operational mobile application with both client and handyman interfaces, supported by a robust backend infrastructure capable of handling user management, service discovery, booking transactions, payment processing, and real-time communication.

**Specific Objective 1 — Requirements Analysis and System Architecture:**
A comprehensive requirements analysis was conducted, identifying three primary user groups (clients, handymen, and administrators) with distinct functional needs. The system architecture was designed and implemented using a three-tier pattern, with Django REST Framework providing a total of 30+ REST API endpoints across ten Django applications, and React Native with Expo delivering cross-platform mobile compatibility. The PostgreSQL database with PostGIS extension was deployed to support spatial data management for location-based service matching. The architecture successfully supports the full range of platform functionality whilst maintaining separation of concerns and enabling independent scaling of each tier.

**Specific Objective 2 — User Management and Authentication:**
A dual-user model architecture was implemented, with separate User (client) and Handyman authentication systems. The JWT token-based authentication provides stateless, secure access control with configurable token lifetimes. Brute force protection through django-axes effectively mitigates credential guessing attacks, locking accounts after five failed attempts. A three-step password reset workflow with OTP verification was implemented for secure account recovery. The ID verification workflow for handymen, involving document upload, automated processing, and administrative approval, establishes the trust and quality assurance mechanisms essential for service marketplace platforms.

**Specific Objective 3 — Location-Based Services and Booking Management:**
Location-based handyman discovery was implemented through location and service filtering endpoints, enabling clients to identify available handymen by service type and geographic area. The booking management system successfully tracks the complete service lifecycle from creation through acceptance, completion, and payment, with six status states and enforced state transition validation. The dual-filtering mechanism in booking listing provides appropriate client and handyman perspectives on booking data.

**Specific Objective 4 — Payment Processing and Real-Time Communication:**
The MeSomb payment gateway integration successfully enables mobile money transactions through MTN Mobile Money and Orange Money, the dominant digital payment providers in Cameroon. The commission-based revenue model with dynamic percentages (70/30 for free, 75/25 for pro, 80/20 for premium subscriptions) provides flexible monetisation. The asynchronous payment processing pattern using background threads appropriately addresses the PIN entry requirement of mobile money transactions. Django Channels implementation provides WebSocket-based real-time chat and presence tracking functionality, enabling immediate coordination between clients and handymen.

### 5.1.3 Key Contributions

**Theoretical Contributions:**

1. **Context-Specific Platform Design:** This project contributes to the literature on digital service marketplaces by documenting the specific adaptations required for implementing on-demand service platforms in West African contexts. The findings demonstrate that successful platforms must accommodate informal economic structures, flexible verification mechanisms, and mobile money payment integration.

2. **Location-Based Service Matching in Informal Addressing Contexts:** The project provides practical insights into implementing location-based service discovery in regions where formal addressing systems are not universally available, contributing knowledge to the growing field of geospatial application development in developing economies.

3. **Dual-User Model Architecture:** The architectural approach of implementing separate User and Handyman authentication models, whilst introducing complexity, provides valuable insights for developers designing platforms serving distinct user categories with different data requirements and access controls.

**Practical Contributions:**

1. **Operational Service Marketplace:** HandymanWest provides a functioning digital marketplace addressing a genuine need in the West Region of Cameroon. The platform enables clients to discover, book, and pay for handyman services through a convenient mobile interface, whilst providing handymen with expanded work opportunities and professional profile management.

2. **Mobile Money Payment Integration:** The MeSomb payment integration demonstrates a practical implementation pattern for incorporating mobile money transactions into service platforms, including the asynchronous payment processing approach required for mobile money PIN workflows.

3. **Quality Assurance Framework:** The ID verification system, rating mechanisms, and review functionality provide a comprehensive quality assurance framework appropriate for informal sector workers, balancing security requirements with accessibility.

### 5.1.4 Limitations of the Project

Whilst the HandymanWest platform successfully achieves its stated objectives, several limitations must be acknowledged:

1. **Geographic Scope:** The platform is designed exclusively for the West Region of Cameroon. Expansion to other regions would require additional location data, potential modifications to the matching algorithm, and adaptation to region-specific requirements.

2. **Real-Time Location Tracking:** The current implementation matches handymen by predefined location areas rather than real-time GPS coordinates, limiting the precision of proximity-based matching for urgent service requirements.

3. **Offline Functionality:** The mobile application requires internet connectivity for most operations, which may limit accessibility in areas with poor network coverage common in parts of the West Region.

4. **Payment Option Limitations:** The platform currently supports only MTN Mobile Money and Orange Money, excluding potential users who prefer other payment methods.

5. **Limited Analytics:** The platform provides basic financial reporting but lacks comprehensive analytics for user behaviour analysis, demand forecasting, and platform performance monitoring.

### 5.1.5 Reflection on the Development Process

The development of HandymanWest followed a systematic approach from requirements analysis through design, implementation, and testing. The agile development methodology, with iterative feature development and continuous integration, enabled progressive refinement of platform functionality based on emerging insights during development.

The Django REST Framework proved well-suited to the project's API requirements, with its serialiser system efficiently handling the complex data transformations required by the platform's nested data models. The React Native with Expo combination provided effective cross-platform compatibility, enabling a single codebase to target both Android and iOS platforms. The integration of WebSocket communication for real-time features added significant value to the platform's user experience.

The most challenging aspect of development was the dual-user model architecture, which required custom authentication classes and type-checking logic in shared views. Future projects may benefit from evaluating whether a unified user model with role-based differentiation could provide simpler implementation at the cost of some data separation.

### 5.1.6 Final Remarks

The HandymanWest project successfully demonstrates that a comprehensive handyman service marketplace can be effectively implemented using modern web and mobile technologies, with appropriate adaptations for the Cameroonian context including mobile money integration, location-based matching, and multi-language support. The platform transforms how maintenance services are discovered and delivered in the West Region, creating a trusted marketplace that benefits both service consumers and providers through increased transparency, convenience, and reliable quality assurance mechanisms.

---

## 5.2 Recommendations

### 5.2.1 Recommendations for Platform Deployment

**1. Phased Rollout Strategy:**
It is recommended that the platform be deployed initially in major urban centres of the West Region (Bafoussam, Dschang, Mbouda) to establish a critical mass of users and service providers before expanding to smaller towns and rural areas. This phased approach would allow for operational learning, system optimisation, and community building before broader geographic coverage.

**2. Strategic Handyman Recruitment:**
The platform's success depends on achieving sufficient handyman coverage to meet client demand. Targeted recruitment efforts should focus on established handymen in each location, offering incentives for early registration and profile completion. Partnership with local trade associations, vocational training centres, and community organisations could accelerate handyman onboarding.

**3. Marketing and User Acquisition:**
A multi-channel marketing strategy incorporating social media advertising, local radio announcements, community event participation, and referral incentives would raise awareness of the platform among potential clients. Emphasis should be placed on communicating the platform's trust and quality assurance benefits, including ID verification and rating systems.

**4. Customer Support Infrastructure:**
Dedicated customer support channels should be established to handle user inquiries, booking disputes, and technical issues. The support conversation functionality implemented in the platform provides the technical foundation, but human support agents are necessary for effective operation.

**5. Payment Processing Optimisation:**
The MeSomb payment integration should be monitored closely during initial deployment to identify and resolve transaction processing issues. Establishing relationships with both MTN and Orange Money for dedicated support channels would improve payment reliability.

### 5.2.2 Recommendations for Platform Enhancement

**1. Real-Time GPS Location Tracking:**
The addition of real-time GPS location tracking for handymen would enable more precise proximity-based matching. Clients could identify handymen currently near their service location, enabling faster response times for urgent service requests. This enhancement would require careful implementation to address battery consumption and privacy concerns.

**2. Automated Scheduling and Calendar Integration:**
Implementing automated scheduling functionality with calendar integration would allow handymen to specify their availability and enable clients to book time slots directly without manual coordination. Integration with standard calendar systems (Google Calendar, Apple Calendar) would improve user convenience.

**3. Enhanced Offline Capabilities:**
Developing offline-first functionality would improve platform accessibility in areas with variable internet connectivity. Cached service listings, queued booking operations, and background data synchronisation would enable basic platform usage even without active internet connections.

**4. Expanded Payment Options:**
Integration with additional payment methods including bank transfers, credit and debit cards (through payment gateways that support Cameroonian banks), and other mobile money providers would expand the platform's user base and transaction flexibility.

**5. Advanced Analytics Dashboard:**
Development of a comprehensive analytics dashboard for administrators would provide insights into user behaviour, service demand patterns, handyman performance metrics, and platform financial health. Data-driven decision-making would optimise platform operations and identify growth opportunities.

**6. Rating Analytics and Fraud Detection:**
Implementation of automated analysis for detecting suspicious rating patterns, potential review fraud, and rating manipulation would protect the integrity of the quality assurance system. Machine learning approaches could identify anomalous rating behaviour for manual review.

**7. Push Notification Enhancement:**
Further testing and optimisation of Firebase Cloud Messaging integration would ensure reliable push notification delivery when the application is in background or inactive states, improving user engagement and timely awareness of booking updates.

### 5.2.3 Recommendations for Future Research

**1. Platform Adoption Study:**
A longitudinal study examining the adoption patterns of HandymanWest in the West Region would provide valuable insights into the factors influencing digital platform adoption in Cameroonian contexts. Research variables could include demographic factors, digital literacy levels, trust in platform mechanisms, and willingness to use mobile money for service payments.

**2. Economic Impact Assessment:**
An economic impact assessment examining how platform participation affects handyman income levels, employment stability, and access to financial services would contribute to understanding the formalisation potential of digital service platforms in informal economies.

**3. Comparative Platform Analysis:**
Comparative research examining HandymanWest alongside other African service platforms (SweepSouth, GetTrove) would identify best practices and contextual adaptations for different regional markets, contributing to a framework for platform design in developing economies.

**4. Multi-Region Expansion Research:**
Research investigating the requirements for expanding the platform to other regions of Cameroon and neighbouring countries would identify commonalities and differences in service marketplace requirements across geographic contexts.

**5. User Experience and Accessibility Study:**
A user experience study examining how varying levels of digital literacy affect platform usability would inform interface improvements and identify accessibility barriers requiring attention.

### 5.2.4 Recommendations for Sustainability

**1. Revenue Model Refinement:**
The current commission-based revenue model should be refined based on operational experience, potentially introducing tiered subscription plans with enhanced features for handymen whilst maintaining affordable access for clients. Premium features could include priority listing placement, advanced analytics for handymen, and promotional tools.

**2. Partnership Development:**
Strategic partnerships with local businesses (hardware stores, building material suppliers), financial institutions (mobile money providers, microfinance organisations), and government agencies (trade ministries, vocational training authorities) could create sustainable revenue streams and enhance platform credibility.

**3. Community Building:**
Investment in community building activities, including handyman training programmes, client education initiatives, and community events, would strengthen the platform's position as a trusted community resource rather than merely a technology platform.

**4. Technical Maintenance and Improvement:**
A structured technical maintenance programme including regular security audits, performance monitoring, dependency updates, and feature enhancements is essential for long-term platform reliability and security.

**5. Data-Driven Decision Making:**
Implementation of systematic data collection and analysis processes would enable evidence-based decision-making for platform improvement, identifying service gaps, user preferences, and operational inefficiencies requiring attention.

---

## 5.3 Chapter Summary

This chapter presented the conclusions drawn from the HandymanWest project, summarising the successful achievement of all research objectives and the development of a fully functional handyman services marketplace for the West Region of Cameroon. The platform makes both theoretical and practical contributions to the fields of digital service marketplaces, mobile application development, and payment integration in African contexts.

The recommendations provided address platform deployment strategy, technical enhancements, future research directions, and sustainability considerations. Implementation of these recommendations would strengthen the platform's market position, improve user experience, and contribute to the long-term success of HandymanWest as a trusted digital marketplace for handyman services in the West Region of Cameroon.