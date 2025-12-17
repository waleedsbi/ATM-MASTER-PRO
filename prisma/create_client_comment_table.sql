-- Create ClientComment table for SQL Server
-- Run this script in SQL Server Management Studio if prisma db push doesn't work

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ClientComment]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ClientComment] (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [workPlanId] INT NOT NULL,
        [atmCode] NVARCHAR(MAX) NOT NULL,
        [imageUrl] NVARCHAR(MAX) NULL,
        [imageType] NVARCHAR(50) NULL,
        [commentText] NVARCHAR(MAX) NOT NULL,
        [commentBy] NVARCHAR(255) NOT NULL,
        [commentByRole] NVARCHAR(50) NOT NULL DEFAULT 'client',
        [parentCommentId] INT NULL,
        [isRead] BIT NOT NULL DEFAULT 0,
        [status] NVARCHAR(50) NOT NULL DEFAULT 'open',
        [createdAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [updatedAt] DATETIME NOT NULL DEFAULT GETDATE()
    );
    
    PRINT 'ClientComment table created successfully';
END
ELSE
BEGIN
    PRINT 'ClientComment table already exists';
END

