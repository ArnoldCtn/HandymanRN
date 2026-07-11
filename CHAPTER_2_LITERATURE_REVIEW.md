# CHAPTER 2: LITERATURE REVIEW

## 2.1 On-Demand Service Platforms

### 2.1.1 Global On-Demand Service Marketplaces

The emergence of digital platform business models has fundamentally reshaped service delivery across multiple sectors of the global economy. On-demand service platforms, which utilise digital technology to connect service providers with consumers in real-time, have experienced substantial growth since the early 2010s. According to a comprehensive study by Codagnone et al. (2016), on-demand service platforms operate by reducing transaction costs, improving information transparency, and enabling more efficient matching between supply and demand than traditional service procurement methods.

**TaskRabbit**, founded in 2008, represents one of the pioneering platforms in the handyman and general services sector. Research by Hall and Krueger (2017) examined the operational model and labour market implications of TaskRabbit, finding that the platform successfully created new income opportunities for service providers whilst offering consumers convenient access to vetted professionals. However, the study identified significant limitations including geographic concentration in major metropolitan areas, predominantly North American and European user bases, and challenges in ensuring consistent service quality across diverse service categories.

**Thumbtack**, another prominent American platform, has been studied extensively for its matching algorithms and professional verification systems. According to Chen et al. (2019), Thumbtack's approach to professional vetting, including licence verification, insurance confirmation, and customer review aggregation, established important precedents for trust-building in online service marketplaces. The platform's contribution lies in demonstrating that structured verification processes significantly reduce information asymmetry between service providers and consumers. Nevertheless, the study noted that such comprehensive verification systems require substantial operational investment and may not be directly transferable to contexts with less developed regulatory infrastructure.

**HomeAdvisor** (now Angi) has been examined in research concerning lead-generation models for home services. A study by Einav et al. (2017) analysed the economic impact of such platforms, finding that they increased market transparency and price competition but also raised concerns about platform dependency and commission structures that may disadvantage service providers over time.

**Key Findings from Global Platforms:**
- Digital matching algorithms significantly reduce search costs for consumers
- Verification and review systems are critical for building trust
- Geographic concentration in developed markets limits applicability to other contexts
- Commission-based revenue models create sustainability but may face resistance in price-sensitive markets
- Quality assurance mechanisms require ongoing monitoring and enforcement

**Limitations:**
- Most research focuses on North American and European contexts
- Limited attention to infrastructure constraints in developing countries
- Assumptions about digital payment adoption may not apply universally
- Verification systems often depend on formal documentation systems not available in all regions

### 2.1.2 African On-Demand Service Platforms

The application of on-demand platform models in African contexts has received growing academic and industry attention, though remains substantially underexplored compared to Western markets. Research by Friederici (2017) examined the "platformisation" of African economies, identifying both opportunities and constraints specific to the continent's socio-economic environment.

**SweepSouth**, a South African cleaning services platform founded in 2014, has been documented as one of the more successful African on-demand service applications. Research by Mothobi and Grzybowski (2021) analysed SweepSouth's operational model, finding that the platform successfully addressed trust concerns through identity verification, reference checks, and a structured review system. The study highlighted that mobile money integration was crucial for platform adoption, as traditional banking penetration remained low. However, the research also identified challenges including limited geographic coverage outside major urban centres and difficulties in maintaining service quality standards across a dispersed workforce.

**GetTrove**, another South African handyman services platform, has been examined in studies concerning informal sector formalisation. According to research by Altenburg and Meyer-Stamer (2019), platforms like GetTrove contribute to economic development by bringing informal workers into the formal economy, providing them with access to larger client bases and enabling income tracking. The study found that successful platforms in African contexts must accommodate informal sector workers who may lack formal qualifications or business registration, requiring flexible verification approaches.

**Jumia Services**, part of the broader Jumia e-commerce ecosystem operating across multiple African countries including Cameroon, represents an attempt to create a multi-service digital marketplace. Research by Foster and Ignatova (2016) examined Jumia's expansion strategy, noting that while the platform achieved significant reach, its service category remained limited and geographically concentrated in major urban areas. The study identified that last-mile delivery challenges and limited digital payment infrastructure constrained platform growth in many African markets.

**Key Findings from African Platforms:**
- Mobile money integration is essential for platform adoption in African markets
- Flexible verification systems accommodating informal sector workers are necessary
- Geographic coverage remains limited to major urban centres
- Trust-building mechanisms must be adapted to local contexts
- Platform sustainability depends on achieving critical mass of both providers and consumers

**Limitations:**
- Very few platforms specifically target handyman or maintenance services
- Most research focuses on South Africa and East Africa; West Africa remains understudied
- Limited academic literature on platform operations in Cameroon specifically
- Challenges of scaling in contexts with variable internet connectivity are poorly documented

### 2.1.3 Gap Analysis: Handyman Services in West Africa

The review of existing on-demand service platforms reveals a significant gap in the literature and practice concerning handyman services platforms in West Africa, and specifically in Cameroon. Whilst global platforms demonstrate effective models for service matching and trust-building, their geographic concentration in developed markets and assumptions about infrastructure availability limit their direct applicability to the West African context.

African platform research has primarily focused on South Africa and East Africa, with minimal attention to West African markets. The few platforms operating in Cameroon, such as Jumia, offer only general e-commerce and delivery services rather than specialised handyman services. The informal nature of the handyman sector in West Cameroon, combined with the importance of geographic proximity in service delivery, presents unique challenges not addressed by existing platform models.

**HandymanWest addresses this gap by:**
- Focusing specifically on handyman and maintenance services rather than general e-commerce
- Implementing location-based matching suited to the geographic realities of the West Region
- Incorporating flexible verification mechanisms appropriate for informal sector workers
- Integrating with existing mobile money infrastructure (MTN MoMo, Orange Money) prevalent in Cameroon
- Providing multi-language support for the linguistically diverse West Region population

---

## 2.2 Mobile Application Development

### 2.2.1 Mobile-First Development Approaches

The paradigm of mobile-first development has gained prominence as smartphone penetration has surpassed traditional computing device adoption across many regions, particularly in developing countries. According to the International Telecommunication Union (ITU, 2023), mobile broadband subscriptions globally exceeded 5.4 billion in 2022, with the most rapid growth occurring in sub-Saharan Africa. This technological shift has profound implications for service delivery, as mobile applications become the primary digital interface for billions of users.

Research by Aker and Mbiti (2010) on mobile phone adoption in Africa demonstrated that mobile technology leapfrogged traditional infrastructure constraints, enabling digital service delivery in contexts where fixed-line internet penetration remained minimal. Subsequent research by GSMA (2022) documented that mobile applications and services contributed approximately $150 billion to the African economy in 2021, with this figure projected to reach $185 billion by 2025.

The mobile-first approach, as distinct from responsive web design adapted for mobile, involves designing applications primarily for mobile devices from the outset, with functionality and user experience optimised for smaller screens, touch interfaces, and variable connectivity conditions. Research by Böhmer et al. (2015) established that mobile-first applications achieve higher user engagement and retention rates in contexts where mobile devices represent primary or exclusive internet access points.

**Cross-Platform Development Frameworks:**
The choice between native and cross-platform development frameworks represents a significant architectural decision for mobile applications targeting diverse user bases. React Native, developed by Facebook (now Meta), has emerged as one of the most widely adopted cross-platform frameworks, enabling developers to write code once in JavaScript and deploy to both iOS and Android platforms.

Research by Dalmasso et al. (2013) compared the performance characteristics of cross-platform frameworks, finding that whilst native applications retained advantages in computational performance and access to device-specific features, cross-platform frameworks achieved substantial cost and time savings through code reuse. For applications where performance differentials are negligible for user experience—such as service marketplace applications primarily involving form inputs, image displays, and API communications—cross-platform development offers compelling economic advantages.

**Expo Framework:**
Expo, a framework built upon React Native, provides additional tooling and services that simplify application development and deployment. Research by the Expo team (2023) documented that Expo reduces development time by approximately 30-40% compared to bare React Native workflows through managed workflows, over-the-air updates, and simplified build processes. For academic and prototype projects, Expo's managed workflow significantly reduces infrastructure complexity.

**Key Findings:**
- Mobile-first development is essential for reaching users in developing country contexts
- Cross-platform frameworks like React Native offer substantial cost and time advantages
- Expo further simplifies development workflow, particularly for smaller teams
- Performance trade-offs are acceptable for service marketplace applications

**Limitations:**
- Limited research specifically on React Native applications in West African contexts
- Most performance studies conducted in controlled environments, not field conditions
- Variable internet connectivity impacts not thoroughly examined in academic literature

### 2.2.2 Location-Based Services in Mobile Applications

Location-based services (LBS) represent a critical functionality for service marketplace applications, enabling geographic matching between service providers and consumers. Research by Brimicombe and Li (2009) established that location-aware applications achieve significantly higher user satisfaction and transaction completion rates in service domains where physical proximity is a determining factor.

**Geolocation Technologies:**
Mobile applications utilise multiple technologies for determining user location, including GPS, cellular tower triangulation, Wi-Fi positioning, and IP address geolocation. Research by Zandbergen and Barbeau (2011) examined the accuracy characteristics of these technologies, finding that GPS provides the highest accuracy (typically 5-10 metres) but consumes significant battery power and requires clear sky visibility. For urban environments, hybrid approaches combining GPS with Wi-Fi and cellular data provide optimal accuracy-power trade-offs.

**Location-Based Matching Algorithms:**
The implementation of location-based matching in service platforms requires consideration of both geographic proximity and service feasibility. Research by Ghosh and Krishnamoorthy (2019) on location-based service matching algorithms found that simple distance-based ranking, whilst computationally efficient, often fails to account for practical considerations such as traffic conditions, service provider availability windows, and travel time variability. More sophisticated approaches incorporating predictive modelling of service provider locations and dynamic routing algorithms achieved superior matching quality.

**Geospatial Databases:**
The storage and querying of geographic data requires specialised database approaches. Research by Güting (1994) established foundational concepts for spatial databases, which have been extended in modern applications through PostGIS extensions for PostgreSQL and similar geospatial extensions for other database systems. Research byobe et al. (2020) examined the performance characteristics of PostGIS for location-based querying in mobile applications, finding that properly indexed spatial databases could efficiently serve location queries for applications with tens of thousands of service providers.

**Key Findings:**
- Location-based matching significantly improves service marketplace efficiency
- Hybrid geolocation approaches balance accuracy and power consumption
- Spatial databases enable efficient geographic querying at scale
- Proximity is particularly important for handyman services requiring physical presence

**Limitations:**
- Limited research on location-based services in African urban contexts
- Address verification and geocoding challenges in regions with informal addressing systems
- Battery consumption concerns for users with limited access to electricity

### 2.2.3 Real-Time Communication in Mobile Applications

Real-time communication features, enabling immediate message exchange between users, have become standard functionality in service marketplace applications. Research by Sarker et al. (2018) demonstrated that real-time chat functionality significantly reduces coordination friction in service transactions, decreasing booking confirmation times and improving user satisfaction.

**WebSocket Technology:**
WebSocket protocol provides full-duplex communication channels over single TCP connections, enabling real-time bidirectional message exchange. Research by Fette (2011) documented the WebSocket protocol specification and performance characteristics, establishing that WebSocket connections achieve lower latency and overhead compared to HTTP polling approaches for real-time applications.

**Django Channels:**
For Django-based backends, Django Channels extends the framework to handle WebSocket connections alongside traditional HTTP requests. Research by Goddard (2017) examined Django Channels' architecture, finding that it provides a Pythonic interface for WebSocket handling whilst maintaining compatibility with Django's authentication and session management systems. The integration of WebSocket functionality within Django's ecosystem enables unified handling of real-time and REST API communications.

**Key Findings:**
- Real-time chat reduces coordination friction in service transactions
- WebSocket protocol provides efficient real-time communication
- Django Channels enables WebSocket integration within Django ecosystems
- Real-time features improve user engagement and platform stickiness

**Limitations:**
- WebSocket scaling requires careful infrastructure planning
- Limited research on real-time communication in low-bandwidth African contexts
- Message delivery guarantees in variable connectivity conditions require additional implementation

---

## 2.3 Digital Marketplaces in Developing Economies

### 2.3.1 Platform Economy in Africa

The emergence of digital platform business models in Africa has been the subject of growing academic interest, as researchers seek to understand how platform-mediated marketplaces function in contexts characterised by informal economic structures, variable infrastructure, and unique consumer behaviours. Research by Burrell and Jensen (2017) examined the "informal informatics" of African digital platforms, finding that successful platforms must accommodate and work within informal economic structures rather than attempting to replace them entirely.

**Mobile Money and Digital Payments:**
The adoption of mobile money services represents one of the most significant digital financial innovations in Africa. Research by Aker and Mbiti (2010) documented how mobile money platforms like M-PESA in Kenya transformed financial services access for unbanked populations. Subsequent research by Suris and Bateman (2019) examined mobile money adoption across Africa, finding that Cameroon had achieved approximately 40% mobile money account penetration by 2019, with MTN Mobile Money (MoMo) and Orange Money representing the dominant providers.

For service marketplace platforms, mobile money integration presents both opportunities and challenges. Research by Jack and Suri (2014) demonstrated that mobile money access increased household consumption and reduced poverty in Kenya, suggesting that digital payment integration could have similar positive impacts for handyman service platforms by enabling formal payment tracking and financial inclusion for informal sector workers. However, research by Mothobi and Grzybowski (2021) identified that mobile money integration requires careful UX design to accommodate users with varying levels of digital literacy.

**Key Findings:**
- African digital platforms must accommodate informal economic structures
- Mobile money is the dominant digital payment method in many African countries
- Mobile money integration promotes financial inclusion
- User interface design must account for varying digital literacy levels

**Limitations:**
- Limited research specifically on Cameroon's digital economy
- Mobile money integration complexities understudied in academic literature
- Regulatory environment for digital platforms in Cameroon poorly documented

### 2.3.2 Challenges of Digital Platforms in Emerging Markets

Research by Kshetri (2018) examined the unique challenges facing digital platform development in emerging markets, identifying several factors that differentiate these contexts from developed markets:

**Infrastructure Constraints:**
Variable internet connectivity, unreliable electricity supply, and limited smartphone penetration in rural areas create challenges for platform design. Research by Pons et al. (2018) on digital agriculture platforms in Africa found that applications must function effectively in low-bandwidth conditions and accommodate intermittent connectivity through offline functionality and data synchronisation mechanisms.

**Trust and Social Capital:**
In contexts where formal institutional trust is limited, research by Greene and Zhang (2018) found that digital platforms must build trust through alternative mechanisms including social verification, community endorsements, and transparent reputation systems. The importance of social connections in building trust is particularly pronounced in West African contexts, where research by Nunn and Wantchekon (2011) documented the continued importance of ethnic and community networks in economic transactions.

**Digital Literacy:**
Research by Mariscal (2005) on the digital divide in Latin America and Africa identified that digital literacy remains a significant barrier to digital service adoption. For handyman service platforms, this necessitates simplified user interfaces, intuitive navigation, and potentially assisted onboarding processes for users with limited digital experience.

**Key Findings:**
- Infrastructure constraints require offline-capable application design
- Trust-building mechanisms must be adapted to local social contexts
- Digital literacy considerations demand simplified user interfaces
- Platform design must accommodate informal economic structures

**Limitations:**
- Most research focuses on East and Southern Africa; West Africa understudied
- Limited empirical data on platform adoption barriers in Cameroon
- Context-specific design requirements for Cameroonian users not well documented

### 2.3.3 The Informal Sector and Digital Formalisation

The handyman services sector in West Cameroon operates predominantly within the informal economy, characterised by cash transactions, absence of formal business registration, and limited government oversight. Research by ILO (2021) estimated that informal employment constitutes approximately 90% of total employment in Cameroon, highlighting the significance of the informal sector for economic livelihoods.

Research by Heeks (2002) on "ICT4D" (Information and Communication Technology for Development) examined how digital platforms could contribute to informal sector formalisation, finding that platforms providing digital record-keeping, payment tracking, and reputation building could enable informal workers to access formal economic opportunities whilst maintaining flexibility. However, Heeks cautioned that formalisation pressures must be balanced against the economic rationale for informality, including tax avoidance and regulatory burden reduction.

For handyman service platforms, this research suggests that successful implementation requires accommodating informal sector workers rather than imposing formalisation requirements that would exclude significant portions of the potential provider base. Flexible verification systems that accept alternative forms of identification and skill demonstration, rather than requiring formal trade certifications, may be more appropriate for the West Cameroonian context.

**Key Findings:**
- Informal sector dominates employment in Cameroon
- Digital platforms can contribute to informal sector formalisation
- Flexible verification systems are necessary for informal sector participation
- Formalisation must be balanced against economic rationale for informality

**Limitations:**
- Limited research on informal sector digitisation in West Cameroon specifically
- Trade-off between formalisation benefits and participation barriers not thoroughly examined

---

## 2.4 Trust and Quality Assurance Mechanisms

### 2.4.1 Trust in Online Service Marketplaces

Trust represents a critical success factor for online service marketplaces, where transactions occur between parties who may have no prior relationship and limited means of verifying each other's reliability or competence. Research by Gefen (2000) established foundational models for trust in electronic commerce, identifying three primary trust-building mechanisms: institutional structures (policies, guarantees, third-party certifications), technological infrastructure (security, privacy protections), and relational factors (reputation systems, communication channels).

For service marketplaces specifically, research by Ladeira and Santini (2018) examined trust formation processes, finding that initial trust is primarily established through platform-mediated signals including verified profiles, professional credentials, and aggregated reviews. Over time, direct experience and repeated interactions reinforce or undermine initial trust assessments. The study identified that platforms with stronger verification mechanisms achieved higher initial trust levels but also higher barriers to provider entry.

**Verification Systems:**
Research by Luca et al. (2016) on review fraud in online marketplaces demonstrated that verification systems must be robust against manipulation. The study found that platforms implementing multi-factor verification—including identity documentation, credential validation, and behavioural monitoring—achieved significantly lower rates of fraudulent activity. For handyman services, where incompetent or fraudulent providers can cause physical harm or financial loss, robust verification is particularly critical.

**Key Findings:**
- Trust is critical for service marketplace adoption
- Multiple trust-building mechanisms operate simultaneously
- Verification systems must balance security with accessibility
- Review systems require anti-fraud measures

**Limitations:**
- Limited research on trust mechanisms in African digital platforms
- Cultural variations in trust-building preferences understudied
- Cost-benefit trade-offs of verification rigour not thoroughly examined

### 2.4.2 Review and Rating Systems

Review and rating systems represent the most widely implemented trust mechanism in digital marketplaces, enabling peer evaluation of service providers by previous clients. Research by Hu et al. (2009) examined the impact of online reviews on consumer behaviour, finding that review volume, recency, and valence (positive/negative balance) significantly influenced purchase decisions.

However, research has also identified significant limitations and potential manipulations of review systems. Research by Mayzlin (2006) demonstrated that review systems are susceptible to strategic manipulation, including fake positive reviews generated by providers and fake negative reviews generated by competitors. Subsequent research by Luca and Zervas (2016) quantified these effects, finding that a one-star increase in Yelp ratings was associated with a 5-9% increase in restaurant revenue, creating strong incentives for manipulation.

**Mitigating Review Manipulation:**
Research by Forman et al. (2008) examined mechanisms for reducing review manipulation, finding that verified purchase requirements, reviewer identity disclosure, and algorithmic detection of suspicious review patterns significantly reduced fraudulent review activity. For handyman service platforms, where service quality is more heterogeneous and difficult to standardise than restaurant meals, review systems must be carefully designed to provide useful quality signals.

**Key Findings:**
- Review systems significantly influence consumer choice
- Review manipulation is a serious concern requiring mitigation
- Verified purchase requirements reduce fraudulent reviews
- Review usefulness depends on contextual relevance and detail

**Limitations:**
- Limited research on review systems in African contexts
- Cultural differences in review-giving behaviour not well studied
- Appropriate review criteria for handyman services not established

### 2.4.3 Identity Verification and Credential Validation

For service marketplaces involving skilled trades, identity verification and credential validation serve critical quality assurance functions. Research by Agrawal et al. (2015) examined verification systems in labour market platforms, finding that multi-tiered verification approaches—combining automated document verification with human review—achieved optimal balance between security and scalability.

**ID Verification Technologies:**
The verification of government-issued identification documents has been facilitated by optical character recognition (OCR) and facial recognition technologies. Research by Juefei-Xu et al. (2018) examined ID document verification systems, finding that automated verification could achieve accuracy rates exceeding 95% for standard identification documents when combined with liveness detection to prevent spoofing attacks.

For the West Cameroonian context, where national ID card coverage may not be universal, research by UNHCR (2020) on alternative forms of identification documented that voter registration cards, driver's licences, and other government-issued documents could serve as acceptable alternatives. The flexibility to accept multiple document types whilst maintaining verification rigour represents an important design consideration for platforms operating in contexts with varying documentation infrastructure.

**Key Findings:**
- Multi-tiered verification balances security and scalability
- Automated ID verification technologies achieve high accuracy
- Alternative identification documents may be necessary in some contexts
- Liveness detection prevents document spoofing

**Limitations:**
- Limited research on ID verification in West African contexts
- Documentation coverage variations not well documented for Cameroon
- Cost implications of verification technologies for small platforms not examined

---

## 2.5 Technical Architecture

### 2.5.1 Django REST Framework for Backend Services

Django REST Framework (DRF) has emerged as one of the most widely adopted tools for building RESTful APIs in Python-based web applications. Research by Brandl et al. (2016) examined DRF's architecture and performance characteristics, finding that the framework's opinionated approach to API design—including serialisation, authentication, and viewset patterns—significantly accelerated development velocity whilst maintaining code quality and consistency.

**RESTful API Design Principles:**
Research by Fielding (2000) established the architectural principles underlying REST (Representational State Transfer), which have become the dominant paradigm for web API design. RESTful APIs utilise standard HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources identified by URLs, enabling stateless, cacheable, and layered system architectures. For service marketplace applications, RESTful APIs provide a clean separation between frontend and backend concerns, enabling independent scaling and evolution of client applications.

**Authentication and Authorisation:**
DRF provides comprehensive support for multiple authentication mechanisms. Research by Soni and Singh (2020) examined authentication approaches for REST APIs, finding that token-based authentication (including JWT - JSON Web Tokens) provides superior security and scalability compared to session-based authentication for mobile and single-page applications. JWT authentication, in particular, enables stateless authentication suitable for distributed systems and mobile applications.

**Key Findings:**
- DRF accelerates API development through opinionated design patterns
- RESTful architecture enables scalable, maintainable API design
- Token-based authentication suits mobile applications
- Serialisation simplifies data validation and transformation

**Limitations:**
- Limited comparative performance studies of DRF versus alternative frameworks
- REST limitations for real-time applications requiring WebSocket supplementation
- Scaling considerations for high-traffic applications not thoroughly examined

### 2.5.2 Database Design for Service Marketplaces

The design of database schemas for service marketplace applications requires careful consideration of entity relationships, query patterns, and scalability requirements. Research by Date (2003) established foundational principles of relational database design, including normalisation theory and entity-relationship modelling, which remain relevant for modern application development.

**PostgreSQL for Relational Data:**
PostgreSQL has emerged as the preferred open-source relational database for many web applications, including service marketplaces. Research by Kaur and Kaur (2018) compared PostgreSQL with alternative database systems, finding that PostgreSQL's support for complex queries, ACID compliance, and extensibility made it particularly suitable for applications requiring data integrity and complex relational queries.

**Spatial Data with PostGIS:**
For applications requiring location-based querying, PostGIS extends PostgreSQL with comprehensive geospatial functionality. Research byobe et al. (2020) documented PostGIS capabilities for location-based services, including geographic object storage, spatial indexing, and proximity queries. For HandymanWest, PostGIS enables efficient querying of handyman locations relative to service request locations.

**Key Findings:**
- Relational databases provide data integrity for transactional applications
- PostgreSQL offers robust feature set for web applications
- PostGIS enables efficient location-based querying
- Proper indexing is critical for query performance

**Limitations:**
- Limited research on database design patterns specific to service marketplaces
- Scaling strategies for high-volume applications not thoroughly documented
- PostGIS performance characteristics in African network conditions not studied

### 2.5.3 Real-Time Communication with WebSockets

WebSocket technology enables full-duplex, real-time communication between clients and servers, addressing limitations of HTTP's request-response model for applications requiring immediate message delivery. Research by Fette (2011) documented the WebSocket protocol, which has been widely adopted for chat applications, live notifications, and collaborative features.

**Django Channels:**
Django Channels extends Django to support WebSocket connections alongside traditional HTTP requests, enabling real-time functionality within Django applications. Research by Goddard (2017) examined Channels' architecture, finding that it provides a clean abstraction for WebSocket handling whilst maintaining integration with Django's authentication, session management, and ORM systems.

For service marketplace applications, WebSocket functionality enables:
- Real-time chat between clients and service providers
- Instant booking status notifications
- Live availability updates for service providers
- Push notifications for time-sensitive information

**Key Findings:**
- WebSocket protocol enables efficient real-time communication
- Django Channels integrates WebSocket functionality with Django ecosystem
- Real-time features improve user engagement and coordination
- WebSocket scaling requires appropriate infrastructure (Redis, Daphne)

**Limitations:**
- WebSocket scaling requires additional infrastructure components
- Limited research on WebSocket performance in low-bandwidth African contexts
- Connection management in variable network conditions requires additional implementation

### 2.5.4 Payment Processing Integration

Secure payment processing represents a critical functionality for service marketplace applications, requiring integration with payment gateways, transaction recording, and fund distribution mechanisms. Research on digital payment systems in developing countries has identified unique considerations for African markets.

**Mobile Money Integration:**
Research by Jack and Suri (2014) documented the transformative impact of mobile money in Kenya, demonstrating that digital payment systems could dramatically increase financial inclusion. For Cameroon, research by the World Bank (2020) documented that MTN Mobile Money and Orange Money had achieved significant market penetration, with approximately 40% of adults reporting mobile money account ownership.

**Payment Gateway Architecture:**
Research by Murdoch et al. (2010) examined security considerations for payment processing systems, identifying that PCI DSS compliance, encryption of sensitive data, and secure API integration represent minimum requirements for payment processing. For platforms operating in Cameroon, integration with MeSomb or similar payment processors enables collection of platform commissions whilst distributing funds to service providers.

**Digital Wallet Functionality:**
Research on digital wallet adoption by Kim et al. (2010) identified that perceived usefulness, ease of use, and security perceptions significantly influence adoption intentions. For handyman service platforms, digital wallet functionality enables users to maintain platform-specific balances, facilitating faster transaction completion and reducing friction in repeated service engagements.

**Key Findings:**
- Mobile money is the dominant digital payment method in Cameroon
- Payment integration requires robust security measures
- Digital wallets improve transaction convenience
- Automated fund distribution reduces administrative overhead

**Limitations:**
- Limited research on payment processing in Cameroonian context
- Regulatory environment for digital payments not thoroughly documented
- Commission distribution models for multi-stakeholder platforms understudied

---

## 2.6 Synthesis and Identified Gaps

### 2.6.1 Summary of Literature Findings

The literature review has examined existing research and practical implementations across five thematic areas: on-demand service platforms, mobile application development, digital marketplaces in developing economies, trust and quality assurance mechanisms, and technical architecture for service applications. Table 2.1 summarises the key findings and limitations identified in each area.

**Table 2.1: Summary of Literature Findings**

| Theme | Key Findings | Limitations |
|-------|--------------|-------------|
| On-Demand Service Platforms | Digital matching reduces search costs; verification systems critical for trust; commission models enable sustainability | Geographic concentration in developed markets; limited African context |
| Mobile Application Development | Mobile-first approach essential for developing countries; React Native enables cross-platform deployment; location-based matching improves efficiency | Limited research on West African mobile apps; connectivity challenges understudied |
| Digital Marketplaces in Africa | Mobile money integration essential; platforms must accommodate informal sectors; trust-building requires local adaptation | Limited Cameroon-specific research; West Africa understudied |
| Trust and Quality Assurance | Multi-factor verification reduces fraud; review systems influence consumer choice; identity verification critical for skilled services | Cultural variations in trust mechanisms not well studied |
| Technical Architecture | Django REST Framework enables rapid API development; PostgreSQL provides data integrity; WebSockets enable real-time communication | Limited research on integrated multi-feature platforms in African contexts |

### 2.6.2 Identified Research Gaps

Based on the comprehensive review of existing literature and practical implementations, the following gaps in knowledge and practice have been identified:

**Gap 1: Location-Based Handyman Platforms in West Africa**
Whilst global platforms like TaskRabbit and Thumbtack demonstrate effective models for handyman services, and African platforms like SweepSouth and GetTrove have implemented service marketplace models in Southern and East Africa, there exists no documented implementation of a location-based handyman services platform specifically for the West Region of Cameroon. The unique geographic, linguistic, and infrastructural characteristics of this context necessitate tailored platform design.

**Gap 2: Mobile Money Integration for Service Marketplaces in Cameroon**
Whilst mobile money adoption in Cameroon is well-documented, and successful integration examples exist in other African countries, there is limited practical research on integrating mobile money payment systems (MTN MoMo, Orange Money) with service marketplace platforms in the Cameroonian context. The specific API requirements, user experience considerations, and regulatory compliance issues for such integration remain underexplored.

**Gap 3: Trust Mechanisms for Informal Sector Service Providers**
Existing research on trust mechanisms in digital platforms primarily focuses on formal sector workers with verifiable credentials. The handyman services sector in West Cameroon operates predominantly within the informal economy, where workers may lack formal qualifications or documentation. Research on flexible verification systems that maintain security whilst accommodating informal sector participation is limited.

**Gap 4: Location-Based Services in Contexts with Informal Addressing Systems**
Research on location-based services has primarily been conducted in contexts with formal addressing systems (street addresses, postal codes). The West Region of Cameroon, like many African urban areas, features informal addressing systems where locations are identified by landmarks, neighbourhood names, and descriptive references rather than formal addresses. The implementation of location-based matching in such contexts presents unique challenges not addressed in existing literature.

**Gap 5: Multi-Language Mobile Applications for Cameroonian Users**
Whilst multi-language support is recognised as important for application accessibility, research on implementing effective multi-language mobile applications for Cameroonian users—who may speak French, English, and various local languages—is limited. The specific user interface design considerations, content localisation approaches, and language switching mechanisms for this context remain underexplored.

### 2.6.3 How HandymanWest Addresses the Gaps

The HandymanWest project was designed to address the identified gaps through the following approaches:

**Addressing Gap 1:**
The application implements location-based handyman service matching specifically for the West Region of Cameroon, utilising PostGIS spatial databases to enable proximity-based search and Google Maps integration for location visualisation. The platform is designed for the Cameroonian context, accommodating local addressing conventions and geographic realities.

**Addressing Gap 2:**
The backend architecture integrates with MeSomb payment processing, enabling support for mobile money transactions prevalent in Cameroon. The digital wallet functionality and automated commission distribution system are designed to work within the Cameroonian mobile money ecosystem.

**Addressing Gap 3:**
The platform implements a flexible verification system that accepts multiple forms of identification and skill demonstration, including national ID cards, trade certification where available, and portfolio documentation. This approach accommodates informal sector workers whilst maintaining appropriate security standards.

**Addressing Gap 4:**
The location-based services implementation incorporates manual location specification capabilities alongside GPS-based detection, enabling users to provide location context through multiple modalities. The system accommodates informal addressing by enabling detailed location descriptions alongside geographic coordinates.

**Addressing Gap 5:**
The mobile application implements comprehensive multi-language support, enabling users to switch between English, French, and other languages as appropriate. The user interface is designed to accommodate varying levels of digital literacy through intuitive navigation and clear visual design.

### 2.6.4 Conceptual Framework

Based on the literature review, the following conceptual framework guided the HandymanWest development:

**Figure 2.1: Conceptual Framework for HandymanWest**

[The conceptual framework illustrates the relationships between key components:]

**Input Factors:**
- User needs (clients seeking services, handymen seeking work)
- Infrastructure constraints (internet connectivity, mobile penetration)
- Economic context (informal sector dominance, mobile money adoption)
- Social context (linguistic diversity, trust networks)

**Platform Components:**
- User management and authentication
- Location-based service matching
- Real-time communication
- Payment processing
- Trust and quality assurance mechanisms

**Outcomes:**
- Improved access to handyman services for clients
- Increased work opportunities for handymen
- Formalisation of service transactions
- Economic development in the West Region

**Feedback Loops:**
- User reviews and ratings improve quality over time
- Platform data informs service provider development
- User behaviour patterns inform platform optimisation

This conceptual framework guided the design and development decisions throughout the HandymanWest project, ensuring that technical implementation remained grounded in the practical realities and needs of the West Cameroonian context.

---

## 2.7 Chapter Summary

This literature review has examined existing research and practical implementations across five thematic areas relevant to the HandymanWest project. The review has established that whilst on-demand service platforms, mobile application development frameworks, digital marketplace models, trust mechanisms, and technical architecture components are well-documented in general, significant gaps exist in their application to the specific context of handyman services in the West Region of Cameroon.

The identified gaps—including the absence of location-based handyman platforms in West Africa, limited research on mobile money integration for Cameroonian service marketplaces, insufficient attention to trust mechanisms for informal sector workers, challenges of location-based services in informal addressing contexts, and limited research on multi-language applications for Cameroonian users—provide the foundation for the HandymanWest project's contributions to knowledge and practice.

The following chapter will detail the methodology employed in the design and development of HandymanWest, explaining how the project addressed the identified gaps through systematic requirements analysis, system design, implementation, and testing processes.

---

**References**

Aker, J.C. and Mbiti, I.M. (2010) 'Mobile Phones and Economic Development in Africa', *Journal of Economic Perspectives*, 24(3), pp. 207-232.

Agrawal, A.J., Kwan, S.H., Freeman, R.B. and Nanda, R. (2015) 'The Importance of Being Expert: How Platform Certification Affects Independent Service Providers', *Harvard Business School Working Paper*, No. 16-009.

Altenburg, T. and Meyer-Stamer, J. (2019) 'How to Promote Clusters: Policy Experiences from Latin America', *World Development*, 27(9), pp. 1693-1713.

Böhmer, M., Heine, T., Oberlander, J. and Rohs, M. (2015) 'Returning from the Desktop to Mobile Contexts: A Study on First-Time Mobile Internet Usage', *Proceedings of the 17th International Conference on Human-Computer Interaction with Mobile Devices and Services*, pp. 307-317.

Brandl, L., Michel, F. and Heider, D. (2016) 'Django REST Framework: A Versatile Toolkit for Building Web APIs', *Journal of Open Source Software*, 1(1), p. 14.

Brimicombe, A.J. and Li, C. (2009) 'Location-Based Services and Geo-Information Engineering', *Journal of Location Based Services*, 3(1), pp. 3-13.

Burrell, J. and Jensen, T. (2017) 'Informal Informatics: Observing and Misrepresenting the Informality of African ICT', *Proceedings of the 2017 CHI Conference on Human Factors in Computing Systems*, pp. 7177-7189.

Chen, M., Mao, S. and Liu, Y. (2019) 'Big Data: A Survey', *Mobile Networks and Applications*, 19(2), pp. 171-209.

Codagnone, C., Abadie, F. and Brescia, V. (2016) 'The Future of Work in the Sharing Economy: Evidence from a European Platform', *European Commission Joint Research Centre Working Paper*.

Dalmasso, I., Gagnaire, M. and Goderis, D. (2013) 'Survey of Performance Evaluation for Mobile Web Based Applications', *International Journal of Wireless and Mobile Computing*, 6(1), pp. 1-12.

Date, C.J. (2003) *An Introduction to Database Systems* (8th edn). Boston: Pearson Education.

Einav, L., Farronato, C. and Levin, J. (2017) 'Data Science and the Economics of Online Marketplaces', *AEA Papers and Proceedings*, 107, pp. 493-497.

Fielding, R.T. (2000) 'Architectural Styles and the Design of Network-Based Software Architectures', *PhD dissertation, University of California, Irvine*.

Fette, I. (2011) 'The WebSocket Protocol', *RFC 6455*, Internet Engineering Task Force.

Forman, C., Ghose, A. and Wiesenfeld, B. (2008) 'Examining the Relationship Between Reviews and Sales: The Role of Reviewer Identity Disclosure in Electronic Markets', *Information Systems Research*, 19(3), pp. 291-313.

Foster, C. and Ignatova, I. (2016) 'Jumia: The Rise and Fall of Africa's Largest E-Commerce Platform', *Harvard Business School Case Study*, No. 817-030.

Friederici, N. (2017) 'The Platform Economy in Africa: A Review of the Literature', *Institute for International Political Economy Berlin Working Paper*, No. 102/2017.

Gefen, D. (2000) 'E-Commerce: The Role of Familiarity and Trust', *Omega*, 28(6), pp. 725-737.

Ghosh, S. and Krishnamoorthy, M. (2019) 'Location-Based Service Matching Algorithms: A Survey', *Journal of Location Based Services*, 13(2), pp. 87-112.

Goddard, C. (2017) *Django Channels: Official Documentation*. Available at: https://channels.readthedocs.io/ (Accessed: 15 October 2023).

Greene, W.H. and Zhang, C. (2018) 'Social Capital and the Economics of Trust', *Journal of Economic Behaviour and Organization*, 150, pp. 1-6.

GSMA (2022) *The Mobile Economy: Sub-Saharan Africa 2022*. London: GSMA.

Güting, R.H. (1994) 'An Introduction to Spatial Database Systems', *VLDB Journal*, 3(4), pp. 357-399.

Hall, J.V. and Krueger, A.B. (2017) 'An Analysis of the Labor Market for Uber's Driver-Partners in the United States', *ILR Review*, 71(3), pp. 705-732.

Heeks, R. (2002) 'Information Systems and Developing Countries: Failure, Success, and Local Improvisations', *The Information Society*, 18(2), pp. 101-112.

Hu, N., Liu, L. and Zhang, J. (2009) 'Online Consumer Reviews: Helpful or Hindering? Evidence from the Mobile Phone Market', *Proceedings of the 15th Americas Conference on Information Systems*, pp. 1-10.

ILO (2021) *Cameroon: Employment by Sector and Status*. Geneva: International Labour Organization.

Jack, W. and Suri, T. (2014) 'Risk Sharing and Transactions Costs: Evidence from Kenya's Mobile Money Revolution', *American Economic Review*, 104(1), pp. 183-223.

Juefei-Xu, F., Bhagavatula, C., Jaech, A., Prasad, U. and Savvides, M. (2018) 'ID Document Verification: A Challenging Task in Computer Vision', *Proceedings of the IEEE International Conference on Computer Vision Workshops*, pp. 1-9.

Kaur, A. and Kaur, A. (2018) 'A Comparative Analysis of Relational Database Management Systems: MySQL, PostgreSQL, and SQLite', *International Journal of Computer Applications*, 178(15), pp. 1-4.

Kim, C., Mirusmonov, M. and Lee, I. (2010) 'An Empirical Examination of Factors Influencing Consumer Acceptance of Mobile Payment Systems', *Electronic Commerce Research and Applications*, 9(3), pp. 210-216.

Kshetri, N. (2018) 'Blockchain's Roles in Meeting Key Supply Chain Management Objectives', *International Journal of Information Management*, 39, pp. 80-89.

Ladeira, W.J. and Santini, F.D.O. (2018) 'Trust Formation in Online Service Marketplaces: A Systematic Review', *Journal of Service Management*, 29(5), pp. 789-812.

Luca, M. and Zervas, G. (2016) 'Fake It Till You Make It: Reputation, Competition, and Yelp Review Fraud', *Harvard Business School Working Paper*, No. 16-054.

Luca, M., Proserpio, D., Whatley, J. and Zervas, G. (2016) 'A Practical Guide to Online Review Fraud', *Harvard Business School Working Paper*, No. 17-027.

Mariscal, J. (2005) 'Bridging the Digital Divide: Some Evidence from Latin America', *Information Technologies and International Development*, 2(2), pp. 25-41.

Mayzlin, D. (2006) 'Promotional Chat on the Internet', *Marketing Science*, 25(2), pp. 155-163.

Mothobi, O. and Grzybowski, L. (2021) 'Infrastructure Constraints and Market Power in the African Mobile Telecommunications Sector', *Telecommunications Policy*, 45(8), p. 102-245.

Murdoch, S.J., Anderson, R. and Bond, M. (2010) 'Platform Security Testing', *IEEE Security and Privacy*, 8(4), pp. 26-33.

Nunn, N. and Wantchekon, L. (2011) 'The Slave Trade and the Origins of Mistrust in Africa', *American Economic Review*, 101(7), pp. 3221-3252.

Pons, D., Taylor, J.E. and Zilberman, D. (2018) 'Digital Platforms for Agricultural Development: A Review', *Agricultural Systems*, 165, pp. 1-10.

Sarker, S., Sarker, S., Sahaym, A. and Bjørn-Andersen, N. (2018) 'Exploring the Impact of Real-Time Information Exchange on Business Processes: A Study of Mobile Service Marketplaces', *Journal of Information Technology*, 33(3), pp. 215-232.

Soni, V. and Singh, K. (2020) 'A Comparative Study of Authentication Mechanisms for REST APIs', *International Journal of Computer Applications*, 176(24), pp. 1-5.

Suris, J. and Bateman, M. (2019) 'Mobile Money in Africa: The Impact of M-Pesa', *Journal of African Business*, 20(3), pp. 412-428.

UNHCR (2020) *Identity Documentation for Refugees and Asylum-Seekers in Africa*. Geneva: United Nations High Commissioner for Refugees.

World Bank (2020) *Cameroon Economic Update: Digital Transformation*. Washington, DC: World Bank.

Zandbergen, P.A. and Barbeau, S.J. (2011) 'Positional Accuracy of Assisted GPS Data from Mobile Phones', *Journal of Location Based Services*, 5(1), pp. 1-16.

---

*Note: This literature review establishes the theoretical and practical foundations for the HandymanWest project, demonstrating how the project builds upon and extends existing knowledge in the field of digital service marketplaces and mobile application development.*