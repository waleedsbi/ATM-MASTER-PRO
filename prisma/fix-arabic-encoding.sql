-- SQL Script to fix Arabic encoding issues in BankATM table
-- This converts VARCHAR columns to NVARCHAR to properly support Arabic text

-- Backup the table first (optional but recommended)
-- SELECT * INTO BankATM_Backup FROM BankATM;

-- Check current data types
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BankATM'
    AND COLUMN_NAME IN ('ATMAddress', 'ATMModel', 'ATMSerial');

-- If the columns are VARCHAR, convert them to NVARCHAR
-- Note: This will preserve existing data, but already corrupted data will remain corrupted

-- 1. Convert ATMAddress to NVARCHAR
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
    PRINT 'Converted ATMAddress to NVARCHAR';
END
ELSE
BEGIN
    PRINT 'ATMAddress is already NVARCHAR or does not exist';
END

-- 2. Convert ATMModel to NVARCHAR
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
    PRINT 'Converted ATMModel to NVARCHAR';
END
ELSE
BEGIN
    PRINT 'ATMModel is already NVARCHAR or does not exist';
END

-- 3. Convert ATMSerial to NVARCHAR
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
    PRINT 'Converted ATMSerial to NVARCHAR';
END
ELSE
BEGIN
    PRINT 'ATMSerial is already NVARCHAR or does not exist';
END

-- Check results
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BankATM'
    AND COLUMN_NAME IN ('ATMAddress', 'ATMModel', 'ATMSerial');

PRINT 'Encoding fix completed!';
PRINT 'Note: Existing corrupted data (??????) will remain corrupted.';
PRINT 'You will need to re-import or manually update affected records.';

