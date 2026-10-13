import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarOpen: boolean;
  activeConversationId: number | null;
  composerValue: string;
}

const initialState: UiState = {
  sidebarOpen: true,
  activeConversationId: null,
  composerValue: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setActiveConversation(state, action: PayloadAction<number | null>) {
      state.activeConversationId = action.payload;
    },
    setComposerValue(state, action: PayloadAction<string>) {
      state.composerValue = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setActiveConversation,
  setComposerValue,
} = uiSlice.actions;
export default uiSlice.reducer;
