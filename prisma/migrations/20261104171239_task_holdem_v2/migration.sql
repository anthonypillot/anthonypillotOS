-- AlterTable
ALTER TABLE "task_holdem_room" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "task_holdem_round" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "topic" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "revealed_at" TIMESTAMP(3) NOT NULL,
    "ballots" JSONB NOT NULL,

    CONSTRAINT "task_holdem_round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_holdem_connection" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_holdem_connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_holdem_round_room_id_number_key" ON "task_holdem_round"("room_id", "number");

-- CreateIndex
CREATE INDEX "task_holdem_connection_room_id_participant_id_idx" ON "task_holdem_connection"("room_id", "participant_id");

-- CreateIndex
CREATE INDEX "task_holdem_connection_expires_at_idx" ON "task_holdem_connection"("expires_at");

-- AddForeignKey
ALTER TABLE "task_holdem_round" ADD CONSTRAINT "task_holdem_round_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "task_holdem_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_holdem_connection" ADD CONSTRAINT "task_holdem_connection_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "task_holdem_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
