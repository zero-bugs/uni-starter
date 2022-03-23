-- CreateTable
CREATE TABLE "tbl_img" (
    "id" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "dimension_x" INTEGER NOT NULL,
    "dimension_y" INTEGER NOT NULL,
    "purity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "colors" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "created_time" DATETIME NOT NULL,
    "create_at" DATETIME NOT NULL,
    "update_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tbl_img_ext" (
    "id" TEXT NOT NULL,
    "views" INTEGER NOT NULL,
    "favorites" INTEGER NOT NULL,
    "ratio" DECIMAL NOT NULL,
    "tags" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "create_at" DATETIME NOT NULL,
    "update_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tbl_author" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "create_at" DATETIME NOT NULL,
    "update_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tbl_tag" (
    "name" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "create_at" DATETIME NOT NULL,
    "update_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_img_id_key" ON "tbl_img"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_img_ext_id_key" ON "tbl_img_ext"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_author_name_key" ON "tbl_author"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tag_name_key" ON "tbl_tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_tag_id_key" ON "tbl_tag"("id");
