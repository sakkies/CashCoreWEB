-- Add payment method and payment info columns to discord_users table

-- Add payment method column (e.g., PayPal, Bank Transfer, Crypto, etc.)
ALTER TABLE discord_users 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add payment info column (e.g., PayPal email, bank account, wallet address)
ALTER TABLE discord_users 
ADD COLUMN IF NOT EXISTS payment_info VARCHAR(255);