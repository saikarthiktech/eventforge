-- Demo seed data. Password values are placeholders; production uses Argon2/bcrypt hashes.
INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES
('11111111-1111-1111-1111-111111111111','Asha Rao','asha@example.com','demo_hash_1','ORGANIZER'),
('22222222-2222-2222-2222-222222222222','Rohan Events','rohan@example.com','demo_hash_2','VENDOR'),
('33333333-3333-3333-3333-333333333333','Maya Catering','maya@example.com','demo_hash_3','VENDOR');

INSERT INTO events (event_id, organizer_id, event_name, event_type, event_date, start_time, end_time, venue_city, expected_guests, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','PES Tech Summit','Conference','2027-02-20','09:00','18:00','Bengaluru',350,'PUBLISHED'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','11111111-1111-1111-1111-111111111111','Asha and Vikram Reception','Wedding','2027-03-14','17:00','23:00','Bengaluru',180,'DRAFT');

INSERT INTO vendors (vendor_id, owner_user_id, business_name, category, city, rating, approval_status) VALUES
('44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222','Rohan Sound & Light','Audio Visual','Bengaluru',4.7,'APPROVED'),
('55555555-5555-5555-5555-555555555555','33333333-3333-3333-3333-333333333333','Maya Gourmet Catering','Catering','Bengaluru',4.9,'APPROVED');

INSERT INTO services (service_id, vendor_id, service_name, description, base_price, capacity) VALUES
('66666666-6666-6666-6666-666666666666','44444444-4444-4444-4444-444444444444','Conference AV Package','Professional sound, stage lighting, microphones, projector and on-site technician for conferences.','85000',500),
('77777777-7777-7777-7777-777777777777','55555555-5555-5555-5555-555555555555','Premium Vegetarian Buffet','Vegetarian buffet with regional starters, main course, desserts and service staff for formal events.','120000',400);

INSERT INTO availability_slots (service_id, slot_date, start_time, end_time) VALUES
('66666666-6666-6666-6666-666666666666','2027-02-20','09:00','18:00'),
('77777777-7777-7777-7777-777777777777','2027-02-20','09:00','18:00');

INSERT INTO bookings (booking_id, event_id, service_id, agreed_price, booking_status) VALUES
('88888888-8888-8888-8888-888888888888','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','66666666-6666-6666-6666-666666666666','80000','ACCEPTED'),
('99999999-9999-9999-9999-999999999999','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','77777777-7777-7777-7777-777777777777','115000','PENDING');
