-- CreateTable
CREATE TABLE "BetLog" (
    "id" SERIAL NOT NULL,
    "user" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "outcomeId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BetLog" ADD CONSTRAINT "BetLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EventMetadata"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetLog" ADD CONSTRAINT "BetLog_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
