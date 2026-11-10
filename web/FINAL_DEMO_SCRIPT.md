# EventForge Final Demo Script

## Opening

Our project is EventForge, a smart vendor scheduling and booking platform for multi-vendor events. It helps organizers create events, discover suitable vendors, manage availability, and coordinate event services.

## Demo Sequence

1. Open the EventForge homepage.
2. Explain that the homepage is the organizer entry point.
3. Open the vendor discovery page.
4. Search for `projector`.
5. Show Rohan Sound & Light.
6. Filter by `Catering`.
7. Show Maya Gourmet Catering.
8. Open a vendor details page.
9. Show services, areas, portfolio, FAQs, and ratings.
10. Open the login page.
11. Log in as the organizer.
12. Open the organizer dashboard.
13. Show the event list and dashboard statistics.
14. Open the event creation form.
15. Explain that event data is stored in PostgreSQL.
16. Open the vendor dashboard using the vendor account.
17. Show availability slots.
18. Add a new availability slot.
19. Try an overlapping slot and show that the system rejects it.
20. Open the payment page.
21. Open the review page.
22. Explain that booking-dependent features require a successful booking workflow.

## Database Explanation

PostgreSQL stores users, events, vendors, services, availability, bookings, payments, and reviews. MongoDB stores flexible vendor profiles, tags, portfolios, FAQs, and service areas.

## Closing

The database foundation, authentication, vendor management, event management, availability management, payment tracking, and review features have been implemented. The remaining task is to complete final booking API debugging and end-to-end testing.
