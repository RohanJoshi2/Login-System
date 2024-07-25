-- CreateTable
CREATE TABLE "logs" (
    "type" TEXT NOT NULL,
    "sucess" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "logs_id_key" ON "logs"("id");
