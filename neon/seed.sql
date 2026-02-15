-- ProdLink Seed Data
-- Idempotent - uses ON CONFLICT to skip existing rows

-- ============================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================

INSERT INTO system_settings (key, value) VALUES
    ('default_language', 'en'),
    ('app_name', 'ProdLink')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DEFAULT REASONS (English + Arabic)
-- ============================================

-- Waste reasons
INSERT INTO reasons (name, name_ar, type) VALUES
    ('Expired', 'منتهي الصلاحية', 'waste'),
    ('Contaminated', 'ملوث', 'waste'),
    ('Defective Packaging', 'تغليف معيب', 'waste'),
    ('Quality Failure', 'فشل الجودة', 'waste'),
    ('Overproduction', 'إنتاج زائد', 'waste')
ON CONFLICT (name, type) DO NOTHING;

-- Damage reasons
INSERT INTO reasons (name, name_ar, type) VALUES
    ('Machine Malfunction', 'عطل في الماكينة', 'damage'),
    ('Handling Error', 'خطأ في المناولة', 'damage'),
    ('Storage Damage', 'تلف التخزين', 'damage'),
    ('Transport Damage', 'تلف النقل', 'damage')
ON CONFLICT (name, type) DO NOTHING;

-- Reprocessing reasons
INSERT INTO reasons (name, name_ar, type) VALUES
    ('Off-Spec Product', 'منتج خارج المواصفات', 'reprocessing'),
    ('Labeling Error', 'خطأ في التوسيم', 'reprocessing'),
    ('Weight Deviation', 'انحراف الوزن', 'reprocessing'),
    ('Color Mismatch', 'عدم تطابق اللون', 'reprocessing')
ON CONFLICT (name, type) DO NOTHING;
