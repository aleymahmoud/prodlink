-- ProdLink MySQL Database Schema
-- Run this to set up the MySQL database

-- ============================================
-- USERS TABLE (for MySQL auth - replaces Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'engineer', 'approver', 'viewer') NOT NULL DEFAULT 'engineer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- LINES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS `lines` (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('finished', 'semi-finished') NOT NULL DEFAULT 'finished',
    form_approver_id CHAR(36) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (form_approver_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================
-- USER LINE ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS user_line_assignments (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    line_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_line (user_id, line_id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE CASCADE
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(255) NULL,
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unit',
    line_id CHAR(36) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE SET NULL
);

-- ============================================
-- REASONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reasons (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NULL,
    type ENUM('waste', 'damage', 'reprocessing') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name_type (name, type)
);

-- ============================================
-- PRODUCTION ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS production_entries (
    id CHAR(36) PRIMARY KEY,
    line_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    batch_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CHECK (quantity > 0)
);

-- ============================================
-- DAMAGE ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS damage_entries (
    id CHAR(36) PRIMARY KEY,
    line_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    batch_number VARCHAR(100) NULL,
    reason_id CHAR(36) NOT NULL,
    notes TEXT NULL,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (reason_id) REFERENCES reasons(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CHECK (quantity > 0)
);

-- ============================================
-- REPROCESSING ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS reprocessing_entries (
    id CHAR(36) PRIMARY KEY,
    line_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    batch_number VARCHAR(100) NULL,
    reason_id CHAR(36) NOT NULL,
    notes TEXT NULL,
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (reason_id) REFERENCES reasons(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CHECK (quantity > 0)
);

-- ============================================
-- APPROVAL LEVELS
-- ============================================

CREATE TABLE IF NOT EXISTS approval_levels (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NULL,
    level_order INT NOT NULL UNIQUE,
    approval_type ENUM('sequential', 'parallel') NOT NULL DEFAULT 'sequential',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- APPROVAL LEVEL ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS approval_level_assignments (
    id CHAR(36) PRIMARY KEY,
    approval_level_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_level_user (approval_level_id, user_id),
    FOREIGN KEY (approval_level_id) REFERENCES approval_levels(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ============================================
-- WASTE ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS waste_entries (
    id CHAR(36) PRIMARY KEY,
    line_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    batch_number VARCHAR(100) NULL,
    reason_id CHAR(36) NOT NULL,
    notes TEXT NULL,
    app_approved BOOLEAN NOT NULL DEFAULT FALSE,
    form_approved BOOLEAN NOT NULL DEFAULT FALSE,
    current_approval_level INT DEFAULT 1,
    approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (line_id) REFERENCES `lines`(id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (reason_id) REFERENCES reasons(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CHECK (quantity > 0)
);

-- ============================================
-- WASTE APPROVALS
-- ============================================

CREATE TABLE IF NOT EXISTS waste_approvals (
    id CHAR(36) PRIMARY KEY,
    waste_entry_id CHAR(36) NOT NULL,
    approval_level_id CHAR(36) NOT NULL,
    approved_by CHAR(36) NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    comments TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_waste_level (waste_entry_id, approval_level_id),
    FOREIGN KEY (waste_entry_id) REFERENCES waste_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (approval_level_id) REFERENCES approval_levels(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id CHAR(36) PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO system_settings (id, `key`, value) VALUES
    (UUID(), 'default_language', 'en'),
    (UUID(), 'app_name', 'ProdLink'),
    (UUID(), 'database_provider', 'mysql');

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

CREATE INDEX idx_products_line_id ON products(line_id);
