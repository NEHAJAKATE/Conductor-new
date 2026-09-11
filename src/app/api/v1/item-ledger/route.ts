import { NextResponse } from 'next/server';
import { transactionRepository, inventoryRepository } from '@/infrastructure/repositories/canonical-repositories';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!productId && !search) {
      return NextResponse.json({ error: 'productId or search parameter is required' }, { status: 400 });
    }

    // 1. Get all transactions matching criteria
    const allTxs = await transactionRepository.getAll();
    const openingStockList = await inventoryRepository.list();

    // 2. Identify the target product ID(s)
    let targetProductIds = new Set<string>();
    let productName = '';
    let manufacturer = '';
    let openingStock = 0;
    
    if (productId) {
      targetProductIds.add(productId);
      const openingItem = openingStockList.find(i => i.productId === productId);
      openingStock = openingItem?.quantityOnHand || 0;
      productName = openingItem?.productName || '';
      manufacturer = openingItem?.manufacturer || '';
    } else if (search) {
      const q = search.toLowerCase();
      // Find matching product in opening stock or transactions
      for (const item of openingStockList) {
        if (item.productName.toLowerCase().includes(q) || (item.manufacturer && item.manufacturer.toLowerCase().includes(q))) {
          targetProductIds.add(item.productId);
          openingStock = item.quantityOnHand;
          productName = item.productName;
          manufacturer = item.manufacturer || '';
          break; // CRITICAL FIX: Only match the FIRST exact product to prevent ledger mixing
        }
      }
      
      if (targetProductIds.size === 0) {
        for (const tx of allTxs) {
          let found = false;
          for (const item of tx.items) {
            if (item.productName.toLowerCase().includes(q) || (item.manufacturer && item.manufacturer.toLowerCase().includes(q))) {
              targetProductIds.add(item.productId);
              productName = item.productName;
              manufacturer = item.manufacturer || '';
              found = true;
              break; // CRITICAL FIX: Only match the FIRST exact product
            }
          }
          if (found) break;
        }
      }
    }

    if (targetProductIds.size === 0) {
      return NextResponse.json({
        summary: null,
        items: [],
        total: 0
      });
    }

    // Use the first match for summary if searched by string
    const targetId = Array.from(targetProductIds)[0];

    // 3. Extract item-level movements
    interface ItemMovement {
      id: string;
      date: string;
      type: string;
      partyName: string;
      invoiceId: string;
      qtyChange: number;
      amount: number;
      runningBalance: number;
    }

    const movements: ItemMovement[] = [];
    
    let purchases = 0, salesReturns = 0, sales = 0, purchaseReturns = 0, breakage = 0, adjustments = 0;

    // To compute running balance correctly, we need ALL chronological transactions for this product,
    // not just the filtered ones.
    const allMovementsForProduct: ItemMovement[] = [];

    for (const tx of allTxs) {
      for (const item of tx.items) {
        if (targetProductIds.has(item.productId)) {
          if (!productName) productName = item.productName;
          if (!manufacturer && item.manufacturer) manufacturer = item.manufacturer;

          let qtyChange = 0;
          const qty = item.quantity;
          
          switch (tx.type) {
            case 'purchase': qtyChange = qty; purchases += qty; break;
            case 'sale_return': qtyChange = qty; salesReturns += qty; break;
            case 'sale': qtyChange = -qty; sales += qty; break;
            case 'purchase_return': qtyChange = -qty; purchaseReturns += qty; break;
            case 'breakage': qtyChange = -qty; breakage += qty; break;
            case 'stock_adjustment': qtyChange = qty; adjustments += qty; break;
          }

          if (qtyChange !== 0) {
            allMovementsForProduct.push({
              id: tx.id,
              date: tx.date,
              type: tx.type,
              partyName: tx.partyName,
              invoiceId: tx.invoiceId,
              qtyChange,
              amount: item.netAmount,
              runningBalance: 0 // Will compute sequentially
            });
          }
        }
      }
    }

    // Sort chronologically to compute running balance
    allMovementsForProduct.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = openingStock;
    for (const m of allMovementsForProduct) {
      currentBalance += m.qtyChange;
      m.runningBalance = currentBalance;
    }

    // 4. Apply Date Filters after computing running balance
    let filteredMovements = allMovementsForProduct;
    if (startDate) {
      filteredMovements = filteredMovements.filter(m => m.date >= startDate);
    }
    if (endDate) {
      filteredMovements = filteredMovements.filter(m => m.date <= endDate);
    }

    // 5. Sort descending for display (newest first)
    filteredMovements.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // If same date, sort by runningBalance descending (newer balance first, since it accumulated later)
      // Wait, if it's a purchase, runningBalance goes up. If sale, goes down.
      // A better way: just reverse the array after computing chronologically, 
      // but since we filter by date, let's just use the index from allMovementsForProduct.
      const indexA = allMovementsForProduct.indexOf(a);
      const indexB = allMovementsForProduct.indexOf(b);
      return indexB - indexA;
    });

    // 6. Paginate
    const paginated = filteredMovements.slice(offset, offset + limit);

    return NextResponse.json({
      summary: {
        productId: targetId,
        productName,
        manufacturer,
        openingStock,
        purchases,
        salesReturns,
        sales,
        purchaseReturns,
        breakage,
        adjustments,
        closingStock: currentBalance
      },
      items: paginated,
      total: filteredMovements.length
    });

  } catch (error) {
    console.error('API Error in /item-ledger:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
