import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarOpen: boolean;
  activeConversationId: number | null;
  composerValue: string;
  /** Incremented every time "Start chat" is pressed; ChatInput focuses on change. */
  composerFocusKey: number;
}

const initialState: UiState = {
  sidebarOpen: true,
  activeConversationId: null,
  composerValue: "",
  composerFocusKey: 0,
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
    focusComposer(state) {
      state.composerFocusKey += 1;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setActiveConversation,
  setComposerValue,
  focusComposer,
} = uiSlice.actions;
export default uiSlice.reducer;
