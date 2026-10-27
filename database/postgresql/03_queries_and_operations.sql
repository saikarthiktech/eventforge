-- DML and advanced feature demonstration queries

-- SELECT + JOIN + ORDER BY
SELECT e.event_name, v.business_name, s.service_name, b.booking_status, b.agreed_price
FROM bookings b
JOIN events e ON e.event_id = b.event_id
JOIN services s ON s.service_id = b.service_id
JOIN vendors v ON v.vendor_id = s.vendor_id
ORDER BY e.event_date, b.agreed_price DESC;

-- GROUP BY + HAVING
SELECT v.business_name, COUNT(b.booking_id) AS bookings_count,
       SUM(b.agreed_price) AS revenue
FROM vendors v
JOIN services s ON s.vendor_id = v.vendor_id
JOIN bookings b ON b.service_id = s.service_id
WHERE b.booking_status IN ('PENDING','ACCEPTED')
GROUP BY v.vendor_id, v.business_name
HAVING SUM(b.agreed_price) > 50000;

-- Subquery: approved vendors whose average service price is below the overall average
SELECT business_name
FROM vendors
WHERE vendor_id IN (
  SELECT vendor_id FROM services
  GROUP BY vendor_id
  HAVING AVG(base_price) < (SELECT AVG(base_price) FROM services)
);

-- UPDATE
UPDATE bookings SET booking_status = 'ACCEPTED'
WHERE booking_id = '99999999-9999-9999-9999-999999999999';

-- INSERT and DELETE examples (use in a transaction during testing)
BEGIN;
INSERT INTO payments (event_id, booking_id, amount, payment_status, payment_method, paid_at)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','88888888-8888-8888-8888-888888888888','40000','PAID','UPI',now());
UPDATE availability_slots SET status = 'BOOKED'
WHERE service_id = '66666666-6666-6666-6666-666666666666' AND slot_date = '2027-02-20';
-- DELETE is restricted to a disposable test record to preserve referential integrity.
COMMIT;

-- View
SELECT * FROM event_booking_summary ORDER BY event_date;

-- Stored function + full-text search
SELECT * FROM search_services('sound projector', 'Bengaluru');

-- DELETE demonstration for a test record:
-- DELETE FROM reviews WHERE review_id = '...';
