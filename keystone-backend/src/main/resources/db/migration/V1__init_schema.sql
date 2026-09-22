-- ══════════════════════════════════════════════════════════════
--  V1 — Project KEYSTONE Initial Schema
--  Tables: users, customers, sites, parts, work_orders,
--          work_order_status_history, part_usage, time_logs
-- ══════════════════════════════════════════════════════════════

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(120)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(30)     NOT NULL
                        CHECK (role IN ('DISPATCHER','TECHNICIAN','MANAGER','CUSTOMER')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

-- ── Customers ──────────────────────────────────────────────
CREATE TABLE customers (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    contact_email   VARCHAR(255)    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ── Sites ──────────────────────────────────────────────────
CREATE TABLE sites (
    id              BIGSERIAL       PRIMARY KEY,
    customer_id     BIGINT          NOT NULL REFERENCES customers(id),
    name            VARCHAR(200)    NOT NULL,
    address         VARCHAR(500)    NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sites_customer ON sites (customer_id);

-- ── Parts (Inventory) ─────────────────────────────────────
CREATE TABLE parts (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    sku             VARCHAR(50)     NOT NULL UNIQUE,
    unit_cost       NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    stock_qty       INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_sku ON parts (sku);

-- ── Work Orders ────────────────────────────────────────────
CREATE TABLE work_orders (
    id                  BIGSERIAL       PRIMARY KEY,
    code                VARCHAR(30)     NOT NULL UNIQUE,
    title               VARCHAR(300)    NOT NULL,
    description         TEXT,
    priority            VARCHAR(20)     NOT NULL
                            CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    status              VARCHAR(20)     NOT NULL DEFAULT 'NEW'
                            CHECK (status IN ('NEW','ASSIGNED','IN_PROGRESS',
                                              'ON_HOLD','COMPLETED','CLOSED','CANCELLED')),
    sla_due_at          TIMESTAMP,
    customer_id         BIGINT          NOT NULL REFERENCES customers(id),
    site_id             BIGINT          NOT NULL REFERENCES sites(id),
    assigned_to_user_id BIGINT          REFERENCES users(id),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_status      ON work_orders (status);
CREATE INDEX idx_wo_priority    ON work_orders (priority);
CREATE INDEX idx_wo_assigned    ON work_orders (assigned_to_user_id);
CREATE INDEX idx_wo_customer    ON work_orders (customer_id);
CREATE INDEX idx_wo_sla_due     ON work_orders (sla_due_at);

-- ── Work Order Status History (append-only audit) ──────────
CREATE TABLE work_order_status_history (
    id              BIGSERIAL       PRIMARY KEY,
    work_order_id   BIGINT          NOT NULL REFERENCES work_orders(id),
    from_status     VARCHAR(20),
    to_status       VARCHAR(20)     NOT NULL,
    changed_by      VARCHAR(255)    NOT NULL,
    changed_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    notes           TEXT
);

CREATE INDEX idx_wosh_wo ON work_order_status_history (work_order_id);

-- ── Part Usage ─────────────────────────────────────────────
CREATE TABLE part_usage (
    id              BIGSERIAL       PRIMARY KEY,
    work_order_id   BIGINT          NOT NULL REFERENCES work_orders(id),
    part_id         BIGINT          NOT NULL REFERENCES parts(id),
    qty_used        INTEGER         NOT NULL CHECK (qty_used > 0),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pu_wo   ON part_usage (work_order_id);
CREATE INDEX idx_pu_part ON part_usage (part_id);

-- ── Time Logs ──────────────────────────────────────────────
CREATE TABLE time_logs (
    id              BIGSERIAL       PRIMARY KEY,
    work_order_id   BIGINT          NOT NULL REFERENCES work_orders(id),
    technician_id   BIGINT          NOT NULL REFERENCES users(id),
    minutes         INTEGER         NOT NULL CHECK (minutes > 0),
    note            TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tl_wo   ON time_logs (work_order_id);
CREATE INDEX idx_tl_tech ON time_logs (technician_id);
