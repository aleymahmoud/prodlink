-- ProdLink Database Schema for Neon
-- Adapted from Supabase schema - removes Supabase-specific auth dependencies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'engineer', 'approver', 'viewer');
CREATE TYPE line_type AS ENUM ('finished', 'semi-finished');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE approval_type AS ENUM ('sequential', 'parallel');
CREATE TYPE reason_type AS ENUM ('waste', 'damage', 'reprocessing');

-- ============================================
-- PROFILES TABLE (standalone - auth handled by external provider)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT, -- For storing hashed passwords if using custom auth
    role user_role NOT NULL DEFAULT 'engineer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- LINES TABLE
-- ============================================

CREATE TABLE lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type line_type NOT NULL DEFAULT 'finished',
    form_approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER LINE ASSIGNMENTS
-- ============================================

CREATE TABLE user_line_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, line_id)
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT,
    unit_of_measure TEXT NOT NULL DEFAULT 'unit',
    line_id UUID REFERENCES lines(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- REASONS TABLE
-- ============================================

CREATE TABLE reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    type reason_type NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, type)
);

-- ============================================
-- PRODUCTION ENTRIES
-- ============================================

CREATE TABLE production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
    unit_of_measure TEXT NOT NULL,
    batch_number TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- DAMAGE ENTRIES
-- ============================================

CREATE TABLE damage_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
    unit_of_measure TEXT NOT NULL,
    batch_number TEXT,
    reason_id UUID NOT NULL REFERENCES reasons(id) ON DELETE RESTRICT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- REPROCESSING ENTRIES
-- ============================================

CREATE TABLE reprocessing_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
    unit_of_measure TEXT NOT NULL,
    batch_number TEXT,
    reason_id UUID NOT NULL REFERENCES reasons(id) ON DELETE RESTRICT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- APPROVAL LEVELS (for waste workflow)
-- ============================================

CREATE TABLE approval_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    level_order INTEGER NOT NULL,
    approval_type approval_type NOT NULL DEFAULT 'sequential',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(level_order)
);

-- ============================================
-- APPROVAL LEVEL ASSIGNMENTS (who can approve)
-- ============================================

CREATE TABLE approval_level_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_level_id UUID NOT NULL REFERENCES approval_levels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(approval_level_id, user_id)
);

-- ============================================
-- WASTE ENTRIES
-- ============================================

CREATE TABLE waste_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(12, 3) NOT NULL CHECK (quantity > 0),
    unit_of_measure TEXT NOT NULL,
    batch_number TEXT,
    reason_id UUID NOT NULL REFERENCES reasons(id) ON DELETE RESTRICT,
    notes TEXT,
    app_approved BOOLEAN NOT NULL DEFAULT false,
    form_approved BOOLEAN NOT NULL DEFAULT false,
    current_approval_level INTEGER DEFAULT 1,
    approval_status approval_status NOT NULL DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WASTE APPROVALS (tracking each approval)
-- ============================================

CREATE TABLE waste_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    waste_entry_id UUID NOT NULL REFERENCES waste_entries(id) ON DELETE CASCADE,
    approval_level_id UUID NOT NULL REFERENCES approval_levels(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status approval_status NOT NULL DEFAULT 'pending',
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(waste_entry_id, approval_level_id)
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value) VALUES
    ('default_language', 'en'),
    ('app_name', 'ProdLink');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lines_updated_at BEFORE UPDATE ON lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reasons_updated_at BEFORE UPDATE ON reasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_levels_updated_at BEFORE UPDATE ON approval_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waste_entries_updated_at BEFORE UPDATE ON waste_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waste_approvals_updated_at BEFORE UPDATE ON waste_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_products_line_id ON products(line_id);

CREATE INDEX idx_production_entries_line_id ON production_entries(line_id);
CREATE INDEX idx_production_entries_product_id ON production_entries(product_id);
CREATE INDEX idx_production_entries_created_at ON production_entries(created_at DESC);
CREATE INDEX idx_production_entries_created_by ON production_entries(created_by);

CREATE INDEX idx_waste_entries_line_id ON waste_entries(line_id);
CREATE INDEX idx_waste_entries_approval_status ON waste_entries(approval_status);
CREATE INDEX idx_waste_entries_created_at ON waste_entries(created_at DESC);

CREATE INDEX idx_damage_entries_line_id ON damage_entries(line_id);
CREATE INDEX idx_damage_entries_created_at ON damage_entries(created_at DESC);

CREATE INDEX idx_reprocessing_entries_line_id ON reprocessing_entries(line_id);
CREATE INDEX idx_reprocessing_entries_created_at ON reprocessing_entries(created_at DESC);

CREATE INDEX idx_user_line_assignments_user_id ON user_line_assignments(user_id);
CREATE INDEX idx_user_line_assignments_line_id ON user_line_assignments(line_id);
