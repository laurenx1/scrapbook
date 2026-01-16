-- CreateEnum
CREATE TYPE "element_type" AS ENUM ('photo', 'sticker', 'text');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrapbooks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "theme_category" TEXT NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrapbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "scrapbook_id" UUID NOT NULL,
    "page_order" INTEGER NOT NULL,
    "background_color" TEXT,
    "background_image_url" TEXT,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_elements" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "type" "element_type" NOT NULL,
    "x_pos" DOUBLE PRECISION NOT NULL,
    "y_pos" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "z_index" INTEGER NOT NULL,
    "properties" JSONB NOT NULL,

    CONSTRAINT "page_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrapbook_songs" (
    "scrapbook_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,

    CONSTRAINT "scrapbook_songs_pkey" PRIMARY KEY ("scrapbook_id","song_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "scrapbooks_user_id_idx" ON "scrapbooks"("user_id");

-- CreateIndex
CREATE INDEX "pages_scrapbook_id_idx" ON "pages"("scrapbook_id");

-- CreateIndex
CREATE UNIQUE INDEX "pages_scrapbook_id_page_order_key" ON "pages"("scrapbook_id", "page_order");

-- CreateIndex
CREATE INDEX "page_elements_page_id_idx" ON "page_elements"("page_id");

-- AddForeignKey
ALTER TABLE "scrapbooks" ADD CONSTRAINT "scrapbooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_scrapbook_id_fkey" FOREIGN KEY ("scrapbook_id") REFERENCES "scrapbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_elements" ADD CONSTRAINT "page_elements_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrapbook_songs" ADD CONSTRAINT "scrapbook_songs_scrapbook_id_fkey" FOREIGN KEY ("scrapbook_id") REFERENCES "scrapbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrapbook_songs" ADD CONSTRAINT "scrapbook_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
