/*
  Warnings:

  - Added the required column `reason` to the `logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "reason" TEXT NOT NULL;
