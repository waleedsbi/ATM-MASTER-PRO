-- Performance indexes for better query performance
-- Run this script in SQL Server Management Studio to improve database performance

-- Indexes for ClientComment table (for notifications and queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ClientComment_commentByRole_isRead' AND object_id = OBJECT_ID('dbo.ClientComment'))
BEGIN
    CREATE INDEX IX_ClientComment_commentByRole_isRead 
    ON [dbo].[ClientComment] ([commentByRole], [isRead]);
    PRINT 'Index IX_ClientComment_commentByRole_isRead created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_ClientComment_commentByRole_isRead already exists';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ClientComment_createdAt' AND object_id = OBJECT_ID('dbo.ClientComment'))
BEGIN
    CREATE INDEX IX_ClientComment_createdAt 
    ON [dbo].[ClientComment] ([createdAt] DESC);
    PRINT 'Index IX_ClientComment_createdAt created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_ClientComment_createdAt already exists';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ClientComment_workPlanId' AND object_id = OBJECT_ID('dbo.ClientComment'))
BEGIN
    CREATE INDEX IX_ClientComment_workPlanId 
    ON [dbo].[ClientComment] ([workPlanId]);
    PRINT 'Index IX_ClientComment_workPlanId created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_ClientComment_workPlanId already exists';
END

-- Indexes for BankATM table (for dashboard queries)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BankATM_BankCodeId' AND object_id = OBJECT_ID('dbo.BankATM'))
BEGIN
    CREATE INDEX IX_BankATM_BankCodeId 
    ON [dbo].[BankATM] ([BankCodeId])
    WHERE [IsDeleted] = 0 AND [IsNotActive] = 0;
    PRINT 'Index IX_BankATM_BankCodeId created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_BankATM_BankCodeId already exists';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BankATM_IsDeleted_IsNotActive' AND object_id = OBJECT_ID('dbo.BankATM'))
BEGIN
    CREATE INDEX IX_BankATM_IsDeleted_IsNotActive 
    ON [dbo].[BankATM] ([IsDeleted], [IsNotActive]);
    PRINT 'Index IX_BankATM_IsDeleted_IsNotActive created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_BankATM_IsDeleted_IsNotActive already exists';
END

-- Indexes for WorkPlanHeaders table
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WorkPlanHeaders_IsDeleted' AND object_id = OBJECT_ID('dbo.WorkPlanHeaders'))
BEGIN
    CREATE INDEX IX_WorkPlanHeaders_IsDeleted 
    ON [dbo].[WorkPlanHeaders] ([IsDeleted]);
    PRINT 'Index IX_WorkPlanHeaders_IsDeleted created successfully';
END
ELSE
BEGIN
    PRINT 'Index IX_WorkPlanHeaders_IsDeleted already exists';
END

PRINT 'All performance indexes have been created or already exist';

