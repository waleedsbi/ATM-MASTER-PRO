BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[ATM] (
    [id] INT NOT NULL IDENTITY(1,1),
    [atmCode] NVARCHAR(1000) NOT NULL,
    [atmSerial] NVARCHAR(1000) NOT NULL,
    [atmModel] NVARCHAR(1000) NOT NULL,
    [bankName] NVARCHAR(1000) NOT NULL,
    [governorate] NVARCHAR(1000) NOT NULL,
    [city] NVARCHAR(1000) NOT NULL,
    [address] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ATM_status_df] DEFAULT 'active',
    [startDate] DATETIME2 NOT NULL,
    [lastMaintenance] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ATM_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ATM_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ATM_atmCode_key] UNIQUE NONCLUSTERED ([atmCode])
);

-- CreateTable
CREATE TABLE [dbo].[Maintenance] (
    [id] INT NOT NULL IDENTITY(1,1),
    [atmId] INT NOT NULL,
    [technicianId] INT NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Maintenance_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Maintenance_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Technician] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Technician_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Technician_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Technician_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Bank] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000) NOT NULL,
    [contact] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Bank_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Bank_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Representative] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Representative_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Representative_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Representative_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [Representative_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[WorkPlan] (
    [id] INT NOT NULL IDENTITY(1,1),
    [bankName] NVARCHAR(1000) NOT NULL,
    [startDate] DATETIME2 NOT NULL,
    [endDate] DATETIME2 NOT NULL,
    [governorate] NVARCHAR(1000) NOT NULL,
    [city] NVARCHAR(1000) NOT NULL,
    [statement] NVARCHAR(1000) NOT NULL,
    [representativeId] INT NOT NULL,
    [dates] NVARCHAR(1000) NOT NULL CONSTRAINT [WorkPlan_dates_df] DEFAULT '[]',
    [atmCodes] NVARCHAR(1000) NOT NULL CONSTRAINT [WorkPlan_atmCodes_df] DEFAULT '[]',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [WorkPlan_status_df] DEFAULT 'pending',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WorkPlan_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [WorkPlan_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Governorate] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Governorate_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Governorate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Governorate_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[City] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [governorateId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [City_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [City_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [City_name_governorateId_key] UNIQUE NONCLUSTERED ([name],[governorateId])
);

-- AddForeignKey
ALTER TABLE [dbo].[WorkPlan] ADD CONSTRAINT [WorkPlan_representativeId_fkey] FOREIGN KEY ([representativeId]) REFERENCES [dbo].[Representative]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[City] ADD CONSTRAINT [City_governorateId_fkey] FOREIGN KEY ([governorateId]) REFERENCES [dbo].[Governorate]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
