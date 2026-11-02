-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "marketplaceOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_marketplaceOrderId_key" ON "Transaction"("marketplaceOrderId");

-- CreateTable
CREATE TABLE "MarketplaceSellerMapping" (
    "id" TEXT NOT NULL,
    "marketplaceSellerId" TEXT NOT NULL,
    "escrowUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceSellerMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceSellerMapping_marketplaceSellerId_key" ON "MarketplaceSellerMapping"("marketplaceSellerId");

-- AddForeignKey
ALTER TABLE "MarketplaceSellerMapping" ADD CONSTRAINT "MarketplaceSellerMapping_escrowUserId_fkey" FOREIGN KEY ("escrowUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
