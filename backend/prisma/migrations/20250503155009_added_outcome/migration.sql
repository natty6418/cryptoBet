-- AlterTable
ALTER TABLE "EventMetadata" ADD COLUMN     "pool" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalBets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "winningOutcome" INTEGER,
ALTER COLUMN "longDescription" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Outcome" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eventId" INTEGER NOT NULL,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EventMetadata"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;
