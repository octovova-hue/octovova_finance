-- ====================================================================
-- Octovova Finance — Automatic Database Password Hashing Trigger
-- Ensures NO plaintext passwords can ever be stored in the customer table.
-- Automatically bcrypts any incoming password before insertion or update.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Automatic Password Hashing Trigger Function
CREATE OR REPLACE FUNCTION hash_customer_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- If password is not already a bcrypt hash (starts with $2a$, $2b$, or $2y$), hash it with bcrypt
    IF NEW.password_hash IS NOT NULL AND NOT (NEW.password_hash LIKE '$2%') THEN
        NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 10));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach Trigger to customer table
DROP TRIGGER IF EXISTS trg_hash_customer_password ON customer;
CREATE TRIGGER trg_hash_customer_password
BEFORE INSERT OR UPDATE OF password_hash ON customer
FOR EACH ROW
EXECUTE FUNCTION hash_customer_password_trigger();

-- 3. Encrypt any existing plaintext passwords currently in the table
UPDATE customer
SET password_hash = crypt(password_hash, gen_salt('bf', 10))
WHERE password_hash IS NOT NULL AND password_hash NOT LIKE '$2%';
