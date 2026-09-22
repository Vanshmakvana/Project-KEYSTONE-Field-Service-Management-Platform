-- ══════════════════════════════════════════════════════════════
--  V2 — Seed Data for Development & Testing
--  Passwords are BCrypt-hashed "password123"
-- ══════════════════════════════════════════════════════════════

-- ── Users ──────────────────────────────────────────────────
-- All passwords = "password123" hashed with BCrypt (cost 10)
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Diana Prince',   'dispatcher@keystone.io',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DISPATCHER'),
    ('Tony Stark',     'tech@keystone.io',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TECHNICIAN'),
    ('Nick Fury',      'manager@keystone.io',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'MANAGER'),
    ('Bruce Wayne',    'customer@keystone.io',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUSTOMER');

-- ── Customers ──────────────────────────────────────────────
INSERT INTO customers (name, contact_email) VALUES
    ('Wayne Enterprises',   'contact@wayne-ent.com'),
    ('Stark Industries',    'info@stark-ind.com');

-- ── Sites ──────────────────────────────────────────────────
INSERT INTO sites (customer_id, name, address) VALUES
    (1, 'Wayne Tower',              '1007 Mountain Drive, Gotham City, NJ 07001'),
    (1, 'Wayne Manor Data Center',  '1007 Mountain Drive, Gotham City, NJ 07001'),
    (2, 'Stark Tower',              '200 Park Avenue, New York, NY 10166');

-- ── Parts (Inventory) ─────────────────────────────────────
INSERT INTO parts (name, sku, unit_cost, stock_qty) VALUES
    ('HVAC Filter 20x25',      'HVAC-FLT-2025',    24.99,  150),
    ('Compressor Unit 5-Ton',  'COMP-5T-001',     849.00,   12),
    ('Thermostat Smart Pro',   'THERM-SP-300',    129.99,   45),
    ('Copper Tubing 50ft',     'TUBE-CU-50',       67.50,   80),
    ('Refrigerant R-410A',     'REF-R410A-25',    185.00,   30),
    ('Circuit Breaker 30A',    'CB-30A-SQ',        18.75,  200),
    ('Duct Tape Industrial',   'TAPE-IND-60',       8.99,  500),
    ('Capacitor 45/5 MFD',     'CAP-455-MFD',      14.50,   90);
