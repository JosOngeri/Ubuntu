-- Table to store all M-PESA B2C callback payloads for audit and reconciliation
CREATE TABLE IF NOT EXISTS mpesa_callbacks (
    id SERIAL PRIMARY KEY,
    callback_type VARCHAR(32) NOT NULL, -- 'result' or 'timeout'
    reference VARCHAR(128), -- OriginatorConversationID or TransactionID
    status_code INTEGER,
    status_desc TEXT,
    payload JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    terms TEXT,
    status VARCHAR(32) DEFAULT 'active',
    document_path VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);