# EventForge – Phase 1 (50% Milestone)

**Smart Vendor Scheduling and Booking Platform for Multi-Vendor Events**

## Project status

This package represents the first 50% milestone for the DBMS Level 3 project. It establishes the problem definition, scope, two-database architecture, ER design, relational schema, DDL, seed data, advanced SQL features, MongoDB document model, and implementation roadmap.

## Technology choice

- **Frontend:** Next.js (Phase 2 implementation)
- **Backend/API:** Next.js Route Handlers or a small service layer (Phase 2)
- **SQL database:** PostgreSQL – authoritative transactional data such as users, events, vendors, services, availability, bookings, payments, and reviews
- **NoSQL database:** MongoDB – flexible vendor portfolios, service descriptions, tags, FAQs, and denormalized search/read documents
- **Version control:** Git/GitHub

## Why two database paradigms?

EventForge contains two different data profiles. Booking and payment records require strong consistency, foreign keys, constraints, and transactions; PostgreSQL is therefore the system of record. Vendor portfolios and descriptive service content vary by vendor and evolve frequently; MongoDB is suitable for flexible documents and aggregation-based discovery. The application will keep booking decisions dependent on PostgreSQL while using MongoDB for rich discovery content.

## Included in this milestone

1. Project proposal and requirements mapping (`docs/phase1_report.docx` and `.pdf`)
2. ER diagram source and rendered diagram (`diagrams/eventforge-er.mmd` and `.png`)
3. PostgreSQL DDL with keys, constraints, indexes, view, function, trigger, and transaction examples
4. PostgreSQL seed data covering the core workflow
5. MongoDB collection schema notes and seed documents
6. Phase 2 implementation plan and test checklist

## Not yet included

The remaining 50% includes the complete Next.js UI, API authentication flow, role-based screens, live availability search, booking checkout, MongoDB synchronization worker, automated tests, screenshots, deployment, and final demonstration.

## Initial execution

```bash
# PostgreSQL
psql "$DATABASE_URL" -f database/postgresql/01_schema.sql
psql "$DATABASE_URL" -f database/postgresql/02_seed.sql
psql "$DATABASE_URL" -f database/postgresql/03_queries_and_operations.sql

# MongoDB
mongosh "$MONGODB_URI" database/mongodb/01_seed.js
```

Do not commit real credentials. Use environment variables such as `DATABASE_URL`, `MONGODB_URI`, and `SESSION_SECRET`.

## Team Members

- Member 1: D Sai Karthik
- Member 2: C Rohit Reddy
- Member 3: Chinnala Manish Ranga

