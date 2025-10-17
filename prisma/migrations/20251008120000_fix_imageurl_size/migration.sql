-- AlterTable
-- Modify the imageUrl column to support large Base64 strings
ALTER TABLE [dbo].[ClientComment] ALTER COLUMN [imageUrl] NVARCHAR(MAX);

