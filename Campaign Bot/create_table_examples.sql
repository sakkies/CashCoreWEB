-- Basic table creation with columns
-- Replace 'table_name' with your desired table name

-- Example 1: Simple table with basic columns
CREATE TABLE table_name (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    age INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Example 2: More detailed table with various column types
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    balance DECIMAL(10,2) DEFAULT 0.00,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example 3: Discord users table (specific to your bot)
CREATE TABLE discord_users (
    id BIGSERIAL PRIMARY KEY,
    discord_id VARCHAR(20) UNIQUE NOT NULL,
    discord_username VARCHAR(50) NOT NULL,
    display_name VARCHAR(50),
    email VARCHAR(255),
    is_admin BOOLEAN DEFAULT false,
    total_clips INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example 4: Campaigns table
CREATE TABLE campaigns (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    budget DECIMAL(10,2) NOT NULL,
    platforms VARCHAR(500), -- comma-separated platforms
    thumbnail_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example 5: Adding columns to existing table
-- ALTER TABLE existing_table_name ADD COLUMN new_column_name VARCHAR(100);

-- Example 6: Modifying existing column
-- ALTER TABLE existing_table_name ALTER COLUMN column_name TYPE VARCHAR(200);

-- Example 7: Dropping a column
-- ALTER TABLE existing_table_name DROP COLUMN column_name;

-- User accounts linked per platform for Discord users
CREATE TABLE IF NOT EXISTS user_accounts (
    id BIGSERIAL PRIMARY KEY,
    discord_id VARCHAR(20) NOT NULL,
    platform VARCHAR(32) NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discord_id, platform, username)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_discord_id ON user_accounts(discord_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_platform ON user_accounts(platform);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_user_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_user_accounts_updated_at ON user_accounts;
CREATE TRIGGER trg_user_accounts_updated_at
    BEFORE UPDATE ON user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_accounts_updated_at();

-- Enable RLS and permissive policies (adjust as needed for your project)
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Allow service role (bot) to manage
CREATE POLICY "service role manage" ON user_accounts
    FOR ALL USING (true);

-- Allow users to read accounts (looser example; tighten if needed)
CREATE POLICY "read accounts" ON user_accounts
    FOR SELECT USING (true);