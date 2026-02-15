-- Add username column to profiles (idempotent)
DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN username TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add unique index on username (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
