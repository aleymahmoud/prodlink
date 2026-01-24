-- ProdLink Database Schema
-- Run this in your Supabase SQL Editor

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
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'engineer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE lines ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE user_line_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT,
    unit_of_measure TEXT NOT NULL DEFAULT 'unit',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE reasons ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE damage_entries ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE reprocessing_entries ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE approval_levels ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE approval_level_assignments ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE waste_entries ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE waste_approvals ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO system_settings (key, value) VALUES
    ('default_language', 'en'),
    ('app_name', 'ProdLink');

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Profiles: Users can read all profiles, but only admins can update
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR NOT EXISTS (SELECT 1 FROM profiles) -- Allow first user
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lines: All authenticated users can view active lines
CREATE POLICY "Users can view active lines" ON lines FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage lines" ON lines FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products: All authenticated users can view active products
CREATE POLICY "Users can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reasons: All authenticated users can view active reasons
CREATE POLICY "Users can view active reasons" ON reasons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage reasons" ON reasons FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User Line Assignments: Users can view their own assignments
CREATE POLICY "Users can view own assignments" ON user_line_assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage assignments" ON user_line_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Production Entries: Users can view entries for their assigned lines
CREATE POLICY "Users can view production for assigned lines" ON production_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = production_entries.line_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'viewer'))
);
CREATE POLICY "Engineers can insert production" ON production_entries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = production_entries.line_id)
);

-- Damage Entries: Similar to production
CREATE POLICY "Users can view damage for assigned lines" ON damage_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = damage_entries.line_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'viewer'))
);
CREATE POLICY "Engineers can insert damage" ON damage_entries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = damage_entries.line_id)
);

-- Reprocessing Entries: Similar to production
CREATE POLICY "Users can view reprocessing for assigned lines" ON reprocessing_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = reprocessing_entries.line_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'viewer'))
);
CREATE POLICY "Engineers can insert reprocessing" ON reprocessing_entries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = reprocessing_entries.line_id)
);

-- Waste Entries: Similar to production but also approvers can view
CREATE POLICY "Users can view waste for assigned lines" ON waste_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = waste_entries.line_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'viewer', 'approver'))
);
CREATE POLICY "Engineers can insert waste" ON waste_entries FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_line_assignments WHERE user_id = auth.uid() AND line_id = waste_entries.line_id)
);
CREATE POLICY "Approvers can update waste status" ON waste_entries FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'approver'))
);

-- Approval Levels: All users can view, admins can manage
CREATE POLICY "Users can view approval levels" ON approval_levels FOR SELECT USING (true);
CREATE POLICY "Admins can manage approval levels" ON approval_levels FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Approval Level Assignments
CREATE POLICY "Users can view approval assignments" ON approval_level_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage approval assignments" ON approval_level_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Waste Approvals
CREATE POLICY "Users can view waste approvals" ON waste_approvals FOR SELECT USING (true);
CREATE POLICY "Approvers can manage waste approvals" ON waste_approvals FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'approver'))
);

-- System Settings: All can view, admins can update
CREATE POLICY "Users can view settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE
            WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'admin'::user_role
            ELSE 'engineer'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
