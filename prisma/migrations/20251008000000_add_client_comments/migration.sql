-- CreateTable
CREATE TABLE [dbo].[ClientComment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [workPlanId] INT NOT NULL,
    [atmCode] NVARCHAR(1000) NOT NULL,
    [imageUrl] NVARCHAR(1000),
    [imageType] NVARCHAR(1000),
    [commentText] NVARCHAR(MAX) NOT NULL,
    [commentBy] NVARCHAR(1000) NOT NULL,
    [commentByRole] NVARCHAR(1000) NOT NULL CONSTRAINT [ClientComment_commentByRole_df] DEFAULT 'client',
    [parentCommentId] INT,
    [isRead] BIT NOT NULL CONSTRAINT [ClientComment_isRead_df] DEFAULT 0,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ClientComment_status_df] DEFAULT 'open',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ClientComment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ClientComment_pkey] PRIMARY KEY CLUSTERED ([id])
);

