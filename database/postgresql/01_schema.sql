-- EventForge PostgreSQL schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP VIEW IF EXISTS event_booking_summary;
DROP TABLE IF EXISTS reviews, payments, bookings, availability_slots, services, vendors, events, users CASCADE;

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','ORGANIZER','VENDOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  event_name VARCHAR(160) NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  event_date DATE NOT NULL CHECK (event_date >= CURRENT_DATE),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue_city VARCHAR(80) NOT NULL,
  expected_guests INT NOT NULL CHECK (expected_guests > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','CONFIRMED','COMPLETED','CANCELLED')),
  CHECK (end_time > start_time)
);

CREATE TABLE vendors (
  vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE RESTRICT,
  business_name VARCHAR(160) NOT NULL UNIQUE,
  category VARCHAR(60) NOT NULL,
  city VARCHAR(80) NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING','APPROVED','SUSPENDED'))
);

CREATE TABLE services (
  service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  service_name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  capacity INT NOT NULL CHECK (capacity > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (vendor_id, service_name)
);

CREATE TABLE availability_slots (
  slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','HELD','BOOKED','BLOCKED')),
  CHECK (end_time > start_time),
  UNIQUE (service_id, slot_date, start_time, end_time)
);

CREATE TABLE bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(service_id) ON DELETE RESTRICT,
  agreed_price NUMERIC(12,2) NOT NULL CHECK (agreed_price >= 0),
  booking_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (booking_status IN ('PENDING','ACCEPTED','REJECTED','CANCELLED','COMPLETED')),
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, service_id)
);

CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID','REFUNDED','FAILED')),
  payment_method VARCHAR(30) CHECK (payment_method IN ('CARD','UPI','BANK_TRANSFER','CASH')),
  paid_at TIMESTAMPTZ
);

CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_date_city ON events(event_date, venue_city);
CREATE INDEX idx_services_vendor_active ON services(vendor_id, active);
CREATE INDEX idx_slots_date_status ON availability_slots(slot_date, status);
CREATE INDEX idx_bookings_event_status ON bookings(event_id, booking_status);
CREATE INDEX idx_services_description_fts ON services USING GIN (to_tsvector('english', description));

CREATE VIEW event_booking_summary AS
SELECT e.event_id, e.event_name, e.event_date, e.venue_city,
       COUNT(b.booking_id) AS service_count,
       COALESCE(SUM(b.agreed_price), 0) AS total_committed,
       COUNT(*) FILTER (WHERE b.booking_status = 'ACCEPTED') AS accepted_count
FROM events e
LEFT JOIN bookings b ON b.event_id = e.event_id
GROUP BY e.event_id, e.event_name, e.event_date, e.venue_city;

CREATE OR REPLACE FUNCTION prevent_overlapping_vendor_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM bookings b
    JOIN services s1 ON s1.service_id = b.service_id
    JOIN services s2 ON s2.service_id = NEW.service_id
    JOIN events e1 ON e1.event_id = b.event_id
    JOIN events e2 ON e2.event_id = NEW.event_id
    WHERE s1.vendor_id = s2.vendor_id
      AND b.booking_status IN ('PENDING','ACCEPTED')
      AND e1.event_date = e2.event_date
      AND e1.start_time < e2.end_time
      AND e2.start_time < e1.end_time
      AND b.booking_id <> COALESCE(NEW.booking_id, gen_random_uuid())
  ) THEN
    RAISE EXCEPTION 'Vendor is already booked for an overlapping event';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_overlapping_vendor_booking
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION prevent_overlapping_vendor_booking();

CREATE OR REPLACE FUNCTION search_services(search_text TEXT, city_filter TEXT DEFAULT NULL)
RETURNS TABLE(service_id UUID, service_name VARCHAR, business_name VARCHAR, base_price NUMERIC, rank REAL)
LANGUAGE SQL AS $$
  SELECT s.service_id, s.service_name, v.business_name, s.base_price,
         ts_rank(to_tsvector('english', s.description), plainto_tsquery('english', search_text)) AS rank
  FROM services s JOIN vendors v ON v.vendor_id = s.vendor_id
  WHERE s.active AND v.approval_status = 'APPROVED'
    AND (city_filter IS NULL OR v.city = city_filter)
    AND to_tsvector('english', s.description) @@ plainto_tsquery('english', search_text)
  ORDER BY rank DESC, s.base_price;
$$;
