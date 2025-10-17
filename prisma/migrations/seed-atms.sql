USE [ATM.MASTER]
GO

-- Drop and recreate the table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ATM]') AND type in (N'U'))
DROP TABLE [dbo].[ATM]
GO

CREATE TABLE [dbo].[ATM] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [atmCode] NVARCHAR(50) UNIQUE NOT NULL,
    [atmSerial] NVARCHAR(100) NOT NULL,
    [atmModel] NVARCHAR(100) NOT NULL,
    [bankName] NVARCHAR(200) NOT NULL,
    [governorate] NVARCHAR(100) NOT NULL,
    [city] NVARCHAR(100) NOT NULL,
    [address] NVARCHAR(500) NOT NULL,
    [status] NVARCHAR(50) DEFAULT 'active' NOT NULL,
    [startDate] DATETIME NOT NULL,
    [lastMaintenance] DATETIME NULL,
    [createdAt] DATETIME DEFAULT GETDATE() NOT NULL,
    [updatedAt] DATETIME DEFAULT GETDATE() NOT NULL
)
GO

-- Create trigger for updatedAt
CREATE TRIGGER [dbo].[ATM_UpdatedAt]
ON [dbo].[ATM]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[ATM]
    SET updatedAt = GETDATE()
    FROM [dbo].[ATM] t
    INNER JOIN inserted i ON t.id = i.id
END
GO

-- Insert sample data
INSERT INTO [dbo].[ATM] (atmCode, atmSerial, atmModel, bankName, governorate, city, address, startDate)
VALUES 
  ('EGBN001', 'Heliopolis', 'Heliopolis Branch', N'بنك الإمارات دبي الوطني', N'القاهرة', N'مصر الجديدة', N'43 شارع الحرية، هليوبوليس', '2023-05-11'),
  ('EGBW001', 'Heliopolis', 'Heliopolis Club', N'بنك الإمارات دبي الوطني', N'القاهرة', N'مصر الجديدة', N'نادي هليوبوليس الرياضي', '2023-05-11')
-- Add more INSERT statements for the rest of the ATMs
GO