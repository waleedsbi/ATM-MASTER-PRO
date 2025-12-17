-- =============================================
-- سكربت شامل لإصلاح مشكلة الترميز العربي
-- بعد استعادة النسخة الاحتياطية
-- =============================================
-- 
-- هذا السكربت يقوم بـ:
-- 1. فحص COLLATION الحالي
-- 2. تحويل الحقول النصية إلى NVARCHAR مع COLLATE Arabic_CI_AS
-- 3. إصلاح جميع الجداول الرئيسية
--
-- ⚠️ تحذير: قم بعمل نسخة احتياطية قبل التنفيذ!
-- =============================================

USE [LinkSoft]; -- غيّر اسم قاعدة البيانات حسب الحاجة
GO

PRINT '========================================';
PRINT 'بدء إصلاح الترميز العربي';
PRINT '========================================';
GO

-- =============================================
-- الخطوة 1: فحص COLLATION الحالي
-- =============================================
PRINT '';
PRINT 'الخطوة 1: فحص COLLATION الحالي...';
PRINT '';

SELECT 
    name AS DatabaseName,
    collation_name AS CurrentCollation
FROM sys.databases
WHERE name = DB_NAME();
GO

-- =============================================
-- الخطوة 2: إصلاح جدول BankATM
-- =============================================
PRINT '';
PRINT 'الخطوة 2: إصلاح جدول BankATM...';
PRINT '';

-- ATMAddress
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankATM' 
        AND COLUMN_NAME = 'ATMAddress'
        AND DATA_TYPE = 'varchar'
)
BEGIN
    ALTER TABLE [dbo].[BankATM] 
    ALTER COLUMN [ATMAddress] NVARCHAR(MAX) COLLATE Arabic_CI_AS;
    PRINT '✓ تم تحويل ATMAddress إلى NVARCHAR(MAX)';
END
ELSE IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankATM' 
        AND COLUMN_NAME = 'ATMAddress'
        AND DATA_TYPE = 'nvarchar'
        AND COLLATION_NAME NOT LIKE '%Arabic%'
)
BEGIN
    ALTER TABLE [dbo].[BankATM] 
    ALTER COLUMN [ATMAddress] NVARCHAR(MAX) COLLATE Arabic_CI_AS;
    PRINT '✓ تم تحديث COLLATION لـ ATMAddress';
END
ELSE
BEGIN
    PRINT '✓ ATMAddress بالفعل NVARCHAR مع COLLATE صحيح';
END
GO

-- ATMModel
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankATM' 
        AND COLUMN_NAME = 'ATMModel'
        AND DATA_TYPE = 'varchar'
)
BEGIN
    ALTER TABLE [dbo].[BankATM] 
    ALTER COLUMN [ATMModel] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم تحويل ATMModel إلى NVARCHAR(255)';
END
ELSE IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankATM' 
        AND COLUMN_NAME = 'ATMModel'
        AND DATA_TYPE = 'nvarchar'
        AND COLLATION_NAME NOT LIKE '%Arabic%'
)
BEGIN
    ALTER TABLE [dbo].[BankATM] 
    ALTER COLUMN [ATMModel] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم تحديث COLLATION لـ ATMModel';
END
ELSE
BEGIN
    PRINT '✓ ATMModel بالفعل NVARCHAR مع COLLATE صحيح';
END
GO

-- ATMSerial
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankATM' 
        AND COLUMN_NAME = 'ATMSerial'
        AND DATA_TYPE = 'varchar'
)
BEGIN
    ALTER TABLE [dbo].[BankATM] 
    ALTER COLUMN [ATMSerial] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم تحويل ATMSerial إلى NVARCHAR(255)';
END
ELSE IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankATM' 
        AND COLUMN_NAME = 'ATMSerial'
        AND DATA_TYPE = 'nvarchar'
        AND COLLATION_NAME NOT LIKE '%Arabic%'
)
BEGIN
    ALTER TABLE [dbo].[BankATM] 
    ALTER COLUMN [ATMSerial] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم تحديث COLLATION لـ ATMSerial';
END
ELSE
BEGIN
    PRINT '✓ ATMSerial بالفعل NVARCHAR مع COLLATE صحيح';
END
GO

-- =============================================
-- الخطوة 3: إصلاح جدول BankCode
-- =============================================
PRINT '';
PRINT 'الخطوة 3: إصلاح جدول BankCode...';
PRINT '';

-- BanknameL1
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankCode' 
        AND COLUMN_NAME = 'BanknameL1'
        AND (DATA_TYPE = 'varchar' OR (DATA_TYPE = 'nvarchar' AND COLLATION_NAME NOT LIKE '%Arabic%'))
)
BEGIN
    ALTER TABLE [dbo].[BankCode] 
    ALTER COLUMN [BanknameL1] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم إصلاح BanknameL1';
END
GO

-- BanknameL2
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'BankCode' 
        AND COLUMN_NAME = 'BanknameL2'
        AND (DATA_TYPE = 'varchar' OR (DATA_TYPE = 'nvarchar' AND COLLATION_NAME NOT LIKE '%Arabic%'))
)
BEGIN
    ALTER TABLE [dbo].[BankCode] 
    ALTER COLUMN [BanknameL2] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم إصلاح BanknameL2';
END
GO

-- =============================================
-- الخطوة 4: إصلاح جدول GovernorateCode
-- =============================================
PRINT '';
PRINT 'الخطوة 4: إصلاح جدول GovernorateCode...';
PRINT '';

-- GovernorateNameL1
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'GovernorateCode' 
        AND COLUMN_NAME = 'GovernorateNameL1'
        AND (DATA_TYPE = 'varchar' OR (DATA_TYPE = 'nvarchar' AND COLLATION_NAME NOT LIKE '%Arabic%'))
)
BEGIN
    ALTER TABLE [dbo].[GovernorateCode] 
    ALTER COLUMN [GovernorateNameL1] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم إصلاح GovernorateNameL1';
END
GO

-- GovernorateNameL2
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'GovernorateCode' 
        AND COLUMN_NAME = 'GovernorateNameL2'
        AND (DATA_TYPE = 'varchar' OR (DATA_TYPE = 'nvarchar' AND COLLATION_NAME NOT LIKE '%Arabic%'))
)
BEGIN
    ALTER TABLE [dbo].[GovernorateCode] 
    ALTER COLUMN [GovernorateNameL2] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم إصلاح GovernorateNameL2';
END
GO

-- =============================================
-- الخطوة 5: إصلاح جدول CityCode
-- =============================================
PRINT '';
PRINT 'الخطوة 5: إصلاح جدول CityCode...';
PRINT '';

-- CityNameL1
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'CityCode' 
        AND COLUMN_NAME = 'CityNameL1'
        AND (DATA_TYPE = 'varchar' OR (DATA_TYPE = 'nvarchar' AND COLLATION_NAME NOT LIKE '%Arabic%'))
)
BEGIN
    ALTER TABLE [dbo].[CityCode] 
    ALTER COLUMN [CityNameL1] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم إصلاح CityNameL1';
END
GO

-- CityNameL2
IF EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'CityCode' 
        AND COLUMN_NAME = 'CityNameL2'
        AND (DATA_TYPE = 'varchar' OR (DATA_TYPE = 'nvarchar' AND COLLATION_NAME NOT LIKE '%Arabic%'))
)
BEGIN
    ALTER TABLE [dbo].[CityCode] 
    ALTER COLUMN [CityNameL2] NVARCHAR(255) COLLATE Arabic_CI_AS;
    PRINT '✓ تم إصلاح CityNameL2';
END
GO

-- =============================================
-- الخطوة 6: فحص النتائج النهائية
-- =============================================
PRINT '';
PRINT '========================================';
PRINT 'الخطوة 6: فحص النتائج النهائية...';
PRINT '========================================';
PRINT '';

-- فحص BankATM
SELECT 
    'BankATM' AS TableName,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BankATM'
    AND COLUMN_NAME IN ('ATMAddress', 'ATMModel', 'ATMSerial')
ORDER BY COLUMN_NAME;
GO

-- فحص BankCode
SELECT 
    'BankCode' AS TableName,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BankCode'
    AND COLUMN_NAME IN ('BanknameL1', 'BanknameL2')
ORDER BY COLUMN_NAME;
GO

-- فحص GovernorateCode
SELECT 
    'GovernorateCode' AS TableName,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'GovernorateCode'
    AND COLUMN_NAME IN ('GovernorateNameL1', 'GovernorateNameL2')
ORDER BY COLUMN_NAME;
GO

-- فحص CityCode
SELECT 
    'CityCode' AS TableName,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CityCode'
    AND COLUMN_NAME IN ('CityNameL1', 'CityNameL2')
ORDER BY COLUMN_NAME;
GO

-- =============================================
-- الخطوة 7: اختبار البيانات
-- =============================================
PRINT '';
PRINT '========================================';
PRINT 'الخطوة 7: اختبار البيانات...';
PRINT '========================================';
PRINT '';

-- اختبار عرض البيانات العربية
SELECT TOP 5
    b.ATMId,
    b.ATMCode,
    b.ATMAddress,
    bank.BanknameL1,
    gov.GovernorateNameL1,
    city.CityNameL1
FROM [dbo].[BankATM] b
LEFT JOIN [dbo].[BankCode] bank ON b.BankCodeId = bank.BankId
LEFT JOIN [dbo].[GovernorateCode] gov ON b.GovernorateCodeId = gov.GovernorateId
LEFT JOIN [dbo].[CityCode] city ON b.CityCodeId = city.CityId
WHERE b.ATMAddress IS NOT NULL
ORDER BY b.ATMId;
GO

PRINT '';
PRINT '========================================';
PRINT 'تم الانتهاء من إصلاح الترميز!';
PRINT '========================================';
PRINT '';
PRINT 'ملاحظات مهمة:';
PRINT '1. إذا كانت البيانات تظهر كعلامات استفهام (?????)، فهذا يعني أن البيانات تالفة';
PRINT '2. يجب إعادة استيراد البيانات التالفة من ملف Excel/CSV الأصلي';
PRINT '3. عند إدخال بيانات عربية جديدة، استخدم حرف N قبل النص: N''النص العربي''';
PRINT '';
GO

