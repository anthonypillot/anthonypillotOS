-- CreateTable
CREATE TABLE "history_cleaner_job_result" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "history_cleaner_job_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_run_deletion_result" (
    "id" TEXT NOT NULL,
    "history_cleaner_job_result_id" TEXT NOT NULL,
    "count_total" INTEGER,
    "count_success" INTEGER,
    "count_not_found" INTEGER,
    "count_unauthorized" INTEGER,
    "count_unknown" INTEGER,

    CONSTRAINT "workflow_run_deletion_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_deletion_result" (
    "id" TEXT NOT NULL,
    "history_cleaner_job_result_id" TEXT NOT NULL,
    "count_total" INTEGER,
    "count_success" INTEGER,
    "count_not_found" INTEGER,
    "count_unauthorized" INTEGER,
    "count_unknown" INTEGER,

    CONSTRAINT "deployment_deletion_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socket_io_attachments" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "payload" BYTEA
);

-- CreateTable
CREATE TABLE "task_holdem_room" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_holdem_room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_run_deletion_result_history_cleaner_job_result_id_key" ON "workflow_run_deletion_result"("history_cleaner_job_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_deletion_result_history_cleaner_job_result_id_key" ON "deployment_deletion_result"("history_cleaner_job_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "socket_io_attachments_id_key" ON "socket_io_attachments"("id");

-- AddForeignKey
ALTER TABLE "workflow_run_deletion_result" ADD CONSTRAINT "workflow_run_deletion_result_history_cleaner_job_result_id_fkey" FOREIGN KEY ("history_cleaner_job_result_id") REFERENCES "history_cleaner_job_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_deletion_result" ADD CONSTRAINT "deployment_deletion_result_history_cleaner_job_result_id_fkey" FOREIGN KEY ("history_cleaner_job_result_id") REFERENCES "history_cleaner_job_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;
