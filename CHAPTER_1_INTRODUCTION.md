# CHAPTER 1: INTRODUCTION

## 1.1 Background and Statement of the Problem

### 1.1.1 Background

The contemporary digital landscape has fundamentally transformed the manner in which services are delivered and consumed across numerous sectors of the global economy. The proliferation of mobile computing devices, coupled with the widespread availability of high-speed internet connectivity, has facilitated the emergence of platform-based service marketplaces that efficiently connect service providers with consumers. This digital revolution has disrupted traditional service delivery models across diverse domains including transportation, accommodation, food delivery, and professional services, establishing new paradigms for convenience, transparency, and trust in commercial transactions.

Within the domain of home and business maintenance services, the integration of digital technologies presents significant opportunities to address longstanding inefficiencies inherent in conventional service procurement methods. The handyman services sector, encompassing repairs, renovations, cleaning, installations, and general property maintenance, constitutes a substantial segment of the informal and formal economy in both developed and developing nations. In many regions, particularly in sub-Saharan Africa, this sector remains predominantly characterised by informal networks, word-of-mouth referrals, and physical searches for qualified practitioners, resulting in suboptimal outcomes for both service seekers and providers.

The West Region of Cameroon, comprising major urban centres including Bafoussam, Dschang, and Mbouda, alongside numerous semi-urban and rural communities, presents a compelling context for examining the intersection of digital innovation and service delivery. The region's growing population, expanding urban centres, and increasing property development activities have generated substantial demand for maintenance and improvement services. However, the absence of structured digital platforms to facilitate these services has resulted in persistent challenges for residents seeking reliable, skilled, and affordable handyman services.

Traditional methods of locating handyman services in the West Region rely extensively upon personal networks, community recommendations, physical signage, and informal marketplaces. These approaches present significant limitations: they restrict consumer choice to within existing social circles; they lack mechanisms for verifying practitioner qualifications or track records; they offer limited transparency regarding pricing; and they provide no systematic means of ensuring accountability or quality assurance. Furthermore, for individuals newly relocated to the region—whether for employment, education, or family reasons—the absence of established local networks compounds the difficulty of identifying trustworthy service providers.

From the perspective of skilled tradespeople and handymen operating in the West Region, the current landscape presents equally significant challenges. Practitioners lacking extensive local networks or substantial marketing resources struggle to maintain consistent work opportunities and client bases. The reliance on intermittent referrals and physical visibility constrains earning potential and creates economic instability. Moreover, the absence of digital platforms prevents these workers from effectively showcasing their skills, specialisations, and service portfolios to broader audiences of potential clients.

### 1.1.2 Gap in Knowledge and Practice

Despite the demonstrated efficacy of digital service marketplaces in other contexts, there exists a notable absence of purpose-built mobile applications addressing the specific needs of the handyman services sector in the West Region of Cameroon. Existing general-purpose classified advertisement platforms and social media groups provide only partial solutions, lacking the specialised functionality, verification mechanisms, and location-aware matching capabilities required for optimal service delivery in this domain.

The literature concerning on-demand service platforms predominantly focuses on contexts in North America, Europe, and increasingly, East Africa. There remains a relative paucity of research and practical implementation examining the adaptation of such platforms to the socio-economic and technological contexts of West Cameroon, where considerations including variable internet connectivity, diverse payment preferences, multilingual populations, and the importance of geographic proximity in service delivery necessitate tailored approaches.

Furthermore, whilst mobile penetration in Cameroon has increased substantially, with smartphone adoption accelerating particularly in urban centres, the development of locally-relevant mobile applications that address specific regional service gaps remains limited. The intersection of mobile technology, location-based services, and the informal service sector in the West Region represents an underexplored domain with significant potential for socio-economic impact.

### 1.1.3 Statement of the Problem

The fundamental problem addressed by this project is the persistent difficulty experienced by residents and businesses in the West Region of Cameroon in locating reliable, qualified, and affordable handyman services through efficient and transparent channels. This problem manifests through several interconnected dimensions:

**For Service Consumers:**
The absence of a dedicated digital platform forces individuals requiring maintenance services to depend upon unreliable informal networks, physical searches, and unverified recommendations. This approach consumes considerable time and effort, offers limited choice, provides minimal assurance of practitioner competence or reliability, and frequently results in unsatisfactory service outcomes, financial losses, or safety concerns. The problem is particularly acute for newcomers to the region who lack established social connections and local knowledge.

**For Service Providers:**
Skilled handymen and tradespeople operating in the West Region face significant challenges in accessing consistent work opportunities and reaching potential clients beyond their immediate networks. The absence of a structured digital marketplace constrains their ability to market their services professionally, demonstrate their competencies, build reputational capital through verified reviews, or optimise their work schedules and earning potential.

**For the Regional Economy:**
The inefficiencies inherent in the current informal service procurement model represent a drag on economic productivity. Property maintenance and improvement projects are delayed or executed poorly, reducing property values and quality of life. Skilled workers experience underemployment and income instability, whilst potential clients avoid necessary maintenance due to search difficulties, leading to accelerated property deterioration.

This project addressed these problems through the development of HandymanWest, a comprehensive mobile application designed specifically for the West Region of Cameroon. The application was developed to bridge the gap between service seekers and qualified handymen through a digital platform incorporating user authentication, location-based service matching, real-time communication, secure payment processing, and quality assurance mechanisms. The platform was designed to serve three distinct user groups: clients seeking maintenance services, handymen seeking work opportunities, and administrators responsible for platform management and user oversight.

---

## 1.2 Rationale

The development of HandymanWest was motivated by several compelling considerations spanning technological, economic, and social dimensions.

### 1.2.1 Technological Rationale

The project was situated within the broader context of mobile-first application development, which has emerged as the predominant paradigm for digital service delivery in sub-Saharan Africa. With mobile phone penetration exceeding that of traditional computing devices across the region, and with smartphone adoption accelerating, mobile applications represent the most accessible and effective means of delivering digital services to diverse populations. The selection of React Native with Expo for frontend development and Django REST Framework for backend services reflected a deliberate architectural choice to ensure cross-platform compatibility, maintainability, and scalability whilst leveraging well-established, community-supported technologies.

The incorporation of location-based services represented a particularly significant technical contribution. By enabling users to identify handymen based upon geographic proximity, the application addressed a critical requirement for service delivery in contexts where physical accessibility directly impacts service feasibility. The implementation of real-time communication features through WebSocket technology facilitated immediate coordination between clients and service providers, essential for time-sensitive booking arrangements and service discussions.

### 1.2.2 Economic Rationale

The project addressed a genuine market failure in the West Region's service economy. By creating a structured digital marketplace, HandymanWest was designed to increase market efficiency through improved information flow between service seekers and providers. For handymen, the platform offered the potential for increased work opportunities, more stable income streams, and reduced reliance upon intermittent referrals. For clients, the platform promised access to a broader pool of qualified practitioners, transparent pricing information, and quality assurance through verified reviews and ratings.

The digital wallet functionality incorporated into the application was designed to address challenges associated with cash-based transactions, providing secure, traceable payment processing whilst building trust between transaction parties. The platform's commission-based revenue model, wherein a percentage of completed transactions contributed to platform maintenance and administration, established a sustainable economic framework for ongoing operation and enhancement.

### 1.2.3 Social Rationale

Beyond economic considerations, the project carried significant social implications. By improving access to reliable maintenance services, HandymanWest was positioned to contribute to improved housing quality, property maintenance standards, and overall quality of life for residents of the West Region. The platform's verification mechanisms for handyman credentials and identity documentation were designed to enhance consumer safety and protection, addressing concerns regarding unqualified practitioners performing potentially hazardous work.

The multi-language support incorporated into the application reflected the linguistic diversity of the West Region, where French, English, and various local languages are spoken. By ensuring accessibility across language groups, the platform was designed to serve the broadest possible user base and contribute to inclusive digital service delivery.

### 1.2.4 Research and Development Rationale

From an academic and professional development perspective, the project represented a significant undertaking in full-stack mobile application development, integrating multiple complex subsystems including authentication, geolocation, real-time communication, payment processing, and database management. The development process provided an opportunity to investigate the practical challenges and solutions associated with implementing location-based service marketplaces in contexts characterised by variable infrastructure and diverse user requirements. The project contributed to the body of practical knowledge concerning mobile application development for regional African contexts, an area of growing importance as digital transformation accelerates across the continent.

---

## 1.3 Research Questions

### 1.3.1 Main Research Question

The main research question guiding this project was:

**How can a mobile application be designed and developed to effectively connect clients requiring handyman services with qualified service providers in the West Region of Cameroon?**

### 1.3.2 Specific Research Questions

To address the main research question comprehensively, the following specific research questions were investigated:

1. **What functional features and system architecture are required to support reliable user authentication, profile management, and role-based access control for a handyman services marketplace serving clients, service providers, and administrators?**

2. **How can location-based service matching be implemented to enable efficient identification of available handymen based upon geographic proximity to service request locations?**

3. **What mechanisms are necessary to facilitate secure, transparent financial transactions between clients and handymen, including digital wallet functionality and automated payment distribution?**

4. **How can real-time communication features be integrated to support immediate coordination between service seekers and providers, and what quality assurance mechanisms are required to ensure satisfactory service outcomes?**

---

## 1.4 Objectives

### 1.4.1 Overall Objective

The overall objective of the present project was to design, develop, and deploy a fully functional mobile application named HandymanWest that connects clients seeking handyman services with qualified service providers in the West Region of Cameroon through a secure, location-aware digital marketplace.

### 1.4.2 Specific Objectives

To achieve the overall objective, the following specific objectives were pursued:

1. **To analyse the requirements and constraints of the handyman services sector in the West Region of Cameroon, identifying the functional and non-functional requirements necessary for an effective digital service marketplace, and to design a system architecture incorporating Django REST Framework backend services with a React Native mobile frontend.**

2. **To implement comprehensive user management functionality including registration, authentication, profile management, and role-based access control for three user categories (clients, handymen, and administrators), with appropriate verification mechanisms for handyman credentials and service offerings.**

3. **To develop location-based service discovery features enabling clients to identify and select handymen based upon geographic proximity, and to implement booking management functionality allowing service scheduling, status tracking, and appointment coordination between parties.**

4. **To integrate secure payment processing capabilities including digital wallet functionality, transaction recording, and automated fund distribution, alongside real-time communication features facilitating immediate coordination between clients and handymen, and to deploy quality assurance mechanisms including ratings, reviews, and administrative oversight tools.**

---

*Note: This chapter establishes the foundation for the HandymanWest project, situating the development effort within broader technological and regional contexts, articulating the problems addressed, and defining the research questions and objectives that guided the development process.*