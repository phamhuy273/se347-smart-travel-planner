-- CreateEnum
CREATE TYPE "TripVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "PlaceCategory" AS ENUM ('ATTRACTION', 'RESTAURANT', 'HOTEL', 'TRANSPORT', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "phone_number" VARCHAR(20),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verify_token" VARCHAR(255),
    "verify_token_expires_at" TIMESTAMPTZ,
    "google_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "destination" VARCHAR(255) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "cover_image_url" TEXT,
    "visibility" "TripVisibility" NOT NULL DEFAULT 'PRIVATE',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "clone_count" INTEGER NOT NULL DEFAULT 0,
    "source_trip_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_days" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_items" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "trip_day_id" UUID,
    "place_name" VARCHAR(255) NOT NULL,
    "formatted_address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "thumbnail_url" TEXT,
    "category" "PlaceCategory" NOT NULL DEFAULT 'ATTRACTION',
    "start_time" VARCHAR(10),
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "order_index" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "place_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_members" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_invites" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "invite_token" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_likes" (
    "user_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_likes_pkey" PRIMARY KEY ("user_id","trip_id")
);

-- CreateTable
CREATE TABLE "trip_bookmarks" (
    "user_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_bookmarks_pkey" PRIMARY KEY ("user_id","trip_id")
);

-- CreateTable
CREATE TABLE "trip_comments" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "trip_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_checklists" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "item_name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50),
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_days_trip_id_day_number_key" ON "trip_days"("trip_id", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "trip_members_trip_id_user_id_key" ON "trip_members"("trip_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_invites_invite_token_key" ON "trip_invites"("invite_token");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_source_trip_id_fkey" FOREIGN KEY ("source_trip_id") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_items" ADD CONSTRAINT "place_items_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_items" ADD CONSTRAINT "place_items_trip_day_id_fkey" FOREIGN KEY ("trip_day_id") REFERENCES "trip_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_invites" ADD CONSTRAINT "trip_invites_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_likes" ADD CONSTRAINT "trip_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_likes" ADD CONSTRAINT "trip_likes_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_bookmarks" ADD CONSTRAINT "trip_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_bookmarks" ADD CONSTRAINT "trip_bookmarks_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_comments" ADD CONSTRAINT "trip_comments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_comments" ADD CONSTRAINT "trip_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_checklists" ADD CONSTRAINT "trip_checklists_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
