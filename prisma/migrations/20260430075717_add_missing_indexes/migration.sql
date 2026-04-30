-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "item_collections_collectionId_idx" ON "item_collections"("collectionId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
