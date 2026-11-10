# EventForge Project Status

## Project

EventForge is a smart vendor scheduling and booking platform for multi-vendor events.

## Completed Features

### Database

- PostgreSQL relational database
- MongoDB vendor-profile database
- Users, events, vendors, services, availability, bookings, payments, and reviews tables
- Primary keys and foreign keys
- Check constraints
- Indexes
- SQL joins and aggregate queries
- Transactions
- PostgreSQL view
- PostgreSQL stored function
- PostgreSQL trigger for overlapping vendor bookings
- MongoDB text search and vendor filtering

### Frontend

- EventForge homepage
- Vendor discovery page
- Vendor keyword search
- Vendor category filtering
- Vendor detail page
- Event creation form
- Organizer dashboard
- Vendor dashboard
- Organizer booking-history page
- Vendor booking-management page
- Organizer payment page
- Organizer review page
- Vendor ratings and reviews display

### Backend

- PostgreSQL connection
- MongoDB connection
- Health-check API
- Vendor API
- Event API
- Registration API
- Login API
- Session-check API
- Logout API
- Availability API
- Booking request API
- Vendor booking approval API
- Payment API
- Review API

### Authentication and Authorization

- Organizer registration
- Vendor registration
- Password hashing using bcrypt
- Signed HTTP-only session cookie
- Organizer-only pages and operations
- Vendor-only pages and operations
- Role checks in backend APIs

## Demonstration URLs

- Homepage: http://localhost:3000
- Health API: http://localhost:3000/api/health
- Vendor page: http://localhost:3000/vendors
- New event: http://localhost:3000/events/new
- Login: http://localhost:3000/login
- Organizer dashboard: http://localhost:3000/dashboard
- Vendor dashboard: http://localhost:3000/vendor-dashboard
- Vendor bookings: http://localhost:3000/vendor-bookings
- Organizer bookings: http://localhost:3000/bookings
- Payments: http://localhost:3000/payments
- New review: http://localhost:3000/reviews/new
- Availability API: http://localhost:3000/api/availability
- Booking API: http://localhost:3000/api/bookings
- Payment API: http://localhost:3000/api/payments
- Review API: http://localhost:3000/api/reviews

## Demo Accounts

### Organizer

- Email: demo.organizer@example.com
- Password: EventForge123!

### Vendor

- Email: demo.vendor@example.com
- Password: VendorForge123!

Do not display passwords in a public repository or final presentation.

## Known Limitation

The booking request API is implemented but requires final debugging because one test returned an HTTP 500 response. The API must be corrected and tested before declaring the booking workflow fully complete.

## Remaining Work

- Fix and retest the booking request API
- Test vendor booking acceptance and rejection
- Test payment creation with a real booking
- Test review submission after an accepted booking
- Complete end-to-end testing
- Prepare final screenshots
- Update the final report
- Prepare final presentation

## Final Architecture

Browser
→ Next.js frontend
→ Next.js API Route Handlers
→ PostgreSQL and MongoDB

PostgreSQL stores structured transactional data.

MongoDB stores flexible vendor profile data.
