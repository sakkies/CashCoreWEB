-- Simple table creation template
-- Copy and modify this for your needs

CREATE TABLE your_table_name (
    -- Primary key (auto-incrementing)
    id SERIAL PRIMARY KEY,
    
    -- Text columns
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Number columns
    price DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    
    -- Boolean column
    is_active BOOLEAN DEFAULT true,
    
    -- Date/time columns
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_your_table_name_name ON your_table_name(name);
CREATE INDEX idx_your_table_name_created_at ON your_table_name(created_at);
