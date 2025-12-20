# Intern Team 3 - 2025 Property Management System

## Overview

This project is a comprehensive property management system developed by Intern Team 3 in 2025. It is built as a microservices architecture using Docker for containerization, enabling scalable and maintainable management of residential properties, including tenant authentication, property listings, utility readings, invoicing, payments, notifications, and support ticketing.

The system consists of multiple independent services that communicate via APIs and message queues, providing a full-stack solution with a modern web frontend.

## Architecture

The application follows a microservices architecture with the following components:

- **Frontend**: A Next.js-based web application providing the user interface.
- **Backend Services**: Multiple C# ASP.NET Core Web APIs handling specific domains.
- **Supporting Services**: Python Flask service for AI-powered image processing, RabbitMQ for messaging, and various databases.
- **Containerization**: All services are containerized using Docker and orchestrated with Docker Compose.

### Services Overview

#### AA (Authentication & Authorization Service)
- **Technology**: C# ASP.NET Core
- **Purpose**: Handles user authentication, registration, and role-based access control using ASP.NET Identity and JWT tokens.
- **Database**: MySQL
- **Key Features**:
  - User registration and login
  - JWT-based authentication
  - Role management (Admin, Tenant, etc.)
  - Password reset functionality

#### Image Scan Service
- **Technology**: Python Flask
- **Purpose**: Provides AI-powered OCR for extracting meter readings from uploaded images.
- **AI Integration**: Google Gemini AI for image analysis
- **Key Features**:
  - Upload electric and water meter images
  - Automatic reading extraction using AI
  - Support for multiple meter types with custom prompts

#### Invoice Service
- **Technology**: C# ASP.NET Core
- **Purpose**: Manages invoice generation, calculation, and tracking for property utilities and services.
- **Database**: MySQL
- **Key Features**:
  - Automated invoice generation based on readings
  - Pricing configuration
  - Invoice status tracking
  - Scheduled jobs for recurring invoices

#### Notification Service
- **Technology**: C# ASP.NET Core
- **Purpose**: Handles email notifications and messaging for the system.
- **Integrations**: SMTP (Mailjet), RabbitMQ for message queuing
- **Database**: MySQL
- **Key Features**:
  - Email notifications for invoices, payments, and alerts
  - Asynchronous message processing
  - Template-based notifications

#### Payment Service
- **Technology**: C# ASP.NET Core
- **Purpose**: Processes payments for invoices and manages payment records.
- **Integrations**: SePay payment gateway
- **Database**: MySQL
- **Key Features**:
  - Payment processing integration
  - Payment status tracking
  - Invoice-payment linking

#### Property Service
- **Technology**: C# ASP.NET Core
- **Purpose**: Manages property information, units, and tenant assignments.
- **Database**: MySQL
- **Key Features**:
  - Property and unit management
  - Tenant-property associations
  - Property details and configurations

#### Reading Service
- **Technology**: C# ASP.NET Core
- **Purpose**: Manages utility meter readings and data collection.
- **Integrations**: AWS S3 for image storage, RabbitMQ for messaging
- **Database**: MySQL
- **Key Features**:
  - Manual and AI-assisted reading entry
  - Image upload and storage
  - Reading validation and history
  - Integration with invoice generation

#### Ticket Service
- **Technology**: C# ASP.NET Core
- **Purpose**: Provides support ticket system for maintenance requests and issues.
- **Database**: MySQL
- **Key Features**:
  - Ticket creation and management
  - Status tracking
  - Assignment to property staff

#### Frontend
- **Technology**: Next.js (React), TypeScript, Tailwind CSS
- **Purpose**: Web-based user interface for tenants, property managers, and administrators.
- **Libraries**: Radix UI, Chart.js for data visualization, Axios for API calls
- **Key Features**:
  - Responsive dashboard
  - User authentication flows
  - Property and invoice management
  - Data visualization for readings and payments

### Infrastructure
- **Message Queue**: RabbitMQ for asynchronous communication between services
- **Databases**: MySQL databases for each service
- **Container Orchestration**: Docker Compose for local development and deployment
- **Cloud Storage**: AWS S3 for image uploads in Reading Service

## Database Schema

The system uses separate MySQL databases for each microservice to maintain data isolation and scalability. Below is an overview of the key entities and their relationships:

### AA (Authentication & Authorization) Database
- **AspNetUsers**: Extended ASP.NET Identity users with additional fields:
  - FullName, CreatedAt, UpdatedAt
  - OwnerId (for tenant-owner relationships)
- **AspNetRoles**: Standard Identity roles
- **AspNetRoleClaims**: Role claims
- **AspNetUserClaims**: User claims
- **AspNetUserLogins**: External login providers
- **AspNetUserRoles**: User-role assignments
- **AspNetUserTokens**: Authentication tokens

### Property Service Database
- **Houses**: Property information
  - Id, OwnerId (GUID from AA), Name, Address, CreatedAt
  - One-to-many relationship with Rooms
- **Rooms**: Individual units within houses
  - Id, HouseId, Name, Floor, Status (Vacant/Occupied), CreatedAt
- **TenantContracts**: Rental agreements
  - Id, RoomId, TenantId (string from AA), StartDate, EndDate, Price, Status, FileUrl, CreatedAt

### Invoice Service Database
- **Invoices**: Billing records
  - Id, UserId, InvoiceDate, DueDate, TotalAmount, Status, PaidDate, TenantContractId
  - One-to-many relationship with InvoiceItems
- **InvoiceItems**: Line items in invoices
- **Pricing**: Pricing configurations for different services
- **InvoiceOverdueEvents**: Tracking of overdue payments

### Reading Service Database
- **ReadingCycles**: Periods for meter readings
- **MonthlyReadings**: Meter reading records
  - Id, CycleId, ElectricOld/New, WaterOld/New, PhotoUrls, Status, TenantContractId
- **ReadingStatus**: Enum for reading states (Pending, Approved, Rejected)

### Payment Service Database
- **Payments**: Payment transactions
- **PaymentStatus**: Tracking payment processing

### Notification Service Database
- **Notifications**: Email and message records
- **Templates**: Notification templates

### Ticket Service Database
- **Tickets**: Support tickets
- **TicketStatus**: Status tracking for maintenance requests

### Database Relationships
- Users (AA) → Houses (Property) via OwnerId
- Houses → Rooms (one-to-many)
- Rooms → TenantContracts (one-to-many)
- TenantContracts → Invoices (one-to-many)
- TenantContracts → MonthlyReadings (one-to-many)
- Invoices → Payments (one-to-one/many)

All databases use Entity Framework Core with MySQL provider, supporting migrations for schema versioning and updates.

## Prerequisites

- Docker and Docker Compose
- .NET 8.0 SDK (for local development)
- Node.js 18+ (for frontend development)
- Python 3.8+ (for Image Scan Service development)
- MySQL (if running services locally without Docker)

## Configuration

The application uses environment variables for configuration. Key variables include:

- Database connection strings for each service
- JWT settings for authentication
- API keys for external services (Gemini AI, AWS, SMTP, etc.)
- Service URLs and ports
- RabbitMQ configuration

Refer to `docker-compose.yaml` for all required environment variables.

## API Documentation

Each service provides Swagger/OpenAPI documentation:

- AA Service: http://localhost:${AA_SERVICE_PORT}/swagger
- Invoice Service: http://localhost:${INVOICE_SERVICE_PORT}/swagger
- And similarly for other services

## Development

### Project Structure
```
intern-team3-2025/
├── AA/                          # Authentication Service
├── frontend/                    # Next.js Frontend
├── ImageScanService/           # Python AI Service
├── InvoiceService/              # Invoice Management
├── NotificationService/         # Notification Service
├── PaymentService/              # Payment Processing
├── PropertyService/             # Property Management
├── ReadingService/              # Meter Readings
├── TicketService/               # Support Tickets
├── docker-compose.yaml          # Container Orchestration
└── README.md
```

### Adding New Features
1. Identify the appropriate service for the feature
2. Follow the existing patterns for controllers, models, and services
3. Update Docker configuration if needed
4. Test locally and update documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request with detailed description

## License

This project is developed as part of an internship program. Please refer to the organization's licensing policies.
