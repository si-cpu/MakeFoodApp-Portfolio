import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

const initialState: LoadingState = {
  isLoading: false,
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<LoadingState>) => {
      state.isLoading = action.payload.isLoading;
      state.message = action.payload.message;
    },
  },
});

export const { setLoading } = loadingSlice.actions;
export default loadingSlice.reducer; 