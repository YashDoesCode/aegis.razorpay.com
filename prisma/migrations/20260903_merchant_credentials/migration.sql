-- AlterTable
ALTER TABLE "merchants" ADD COLUMN "keyId" TEXT,
ADD COLUMN "encryptedKeySecret" TEXT,
ADD COLUMN "authType" TEXT NOT NULL DEFAULT 'api_key';
