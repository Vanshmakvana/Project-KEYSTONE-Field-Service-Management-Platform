-- The BCrypt hash below is the password "password" for every development user.
UPDATE customers
SET contact = CASE name
    WHEN 'Wayne Enterprises' THEN 'Lucius Fox'
    WHEN 'Stark Industries' THEN 'Pepper Potts'
    ELSE 'Operations Team' END,
    phone = '+1 555 0100',
    location = CASE name
    WHEN 'Wayne Enterprises' THEN 'Gotham City'
    WHEN 'Stark Industries' THEN 'New York City'
    ELSE 'Head Office' END;

UPDATE parts
SET category = 'General', min_stock = 10, supplier = 'KEYSTONE Supply'
WHERE category IS NULL;

INSERT INTO users (name, email, password_hash, role) VALUES
    ('Natasha Romanoff', 'natasha@keystone.io', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TECHNICIAN'),
    ('Steve Rogers', 'steve@keystone.io', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TECHNICIAN')
ON CONFLICT (email) DO NOTHING;

INSERT INTO service_requests (code, customer, issue, description, priority, status, technician, sla_deadline) VALUES
    ('SR-1001', 'Wayne Enterprises', 'Server-room cooling check', 'Temperature alert from the data-centre sensors.', 'High', 'Open', 'Unassigned', NOW() + INTERVAL '4 hours'),
    ('SR-1002', 'Stark Industries', 'Lighting inspection', 'Inspect the lobby lighting circuit.', 'Medium', 'Assigned', 'Tony Stark', NOW() + INTERVAL '1 day')
ON CONFLICT (code) DO NOTHING;

INSERT INTO work_orders (code, title, description, priority, status, sla_due_at, customer_id, site_id, assigned_to_user_id) VALUES
    ('WO-1001', 'Inspect server-room cooling', 'Inspect the cooling system and report any fault.', 'HIGH', 'IN_PROGRESS', NOW() + INTERVAL '4 hours', 1, 2, 2),
    ('WO-1002', 'Replace lobby thermostat', 'Replace the damaged thermostat at the main entrance.', 'MEDIUM', 'NEW', NOW() + INTERVAL '24 hours', 2, 3, NULL),
    ('WO-1003', 'Quarterly HVAC service', 'Complete the scheduled preventative-maintenance check.', 'LOW', 'COMPLETED', NOW() - INTERVAL '1 day', 1, 1, 2)
ON CONFLICT (code) DO NOTHING;
