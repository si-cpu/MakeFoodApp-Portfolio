import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PurchaseStatsDto } from '../../types/purchase';

interface PurchaseState {
  stats: PurchaseStatsDto | null;
}

const initialState: PurchaseState = {
  stats: null,
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    setPurchaseStats(state, action: PayloadAction<PurchaseStatsDto | null>) {
      state.stats = action.payload;
    },
    clearPurchaseStats(state) {
      state.stats = null;
    },
  },
});

export const { setPurchaseStats, clearPurchaseStats } = purchaseSlice.actions;
export default purchaseSlice.reducer; 