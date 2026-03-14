import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobApplication } from '@/lib/types';

interface UIState {
  isJobFormModalOpen: boolean;
  isCustomFieldModalOpen: boolean;
  isDescriptionModalOpen: boolean;
  isInterviewModalOpen: boolean;
  isOfferModalOpen: boolean;
  editingJob: JobApplication | null;
  jobForDescriptionModal: JobApplication | null;
  jobForInterviewModal: JobApplication | null;
  jobForOfferModal: JobApplication | null;
}

const initialState: UIState = {
  isJobFormModalOpen: false,
  isCustomFieldModalOpen: false,
  isDescriptionModalOpen: false,
  isInterviewModalOpen: false,
  isOfferModalOpen: false,
  editingJob: null,
  jobForDescriptionModal: null,
  jobForInterviewModal: null,
  jobForOfferModal: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openJobFormModal: (state) => {
      state.isJobFormModalOpen = true;
    },
    closeJobFormModal: (state) => {
      state.isJobFormModalOpen = false;
      state.editingJob = null;
    },
    setEditingJob: (state, action: PayloadAction<JobApplication | null>) => {
      state.editingJob = action.payload;
    },

    openCustomFieldModal: (state) => {
        state.isCustomFieldModalOpen = true;
    },
    closeCustomFieldModal: (state) => {
        state.isCustomFieldModalOpen = false;
    },

    openDescriptionModal: (state, action: PayloadAction<JobApplication>) => {
      state.isDescriptionModalOpen = true;
      state.jobForDescriptionModal = action.payload;
    },
    closeDescriptionModal: (state) => {
      state.isDescriptionModalOpen = false;
      state.jobForDescriptionModal = null;
    },

    openInterviewModal: (state, action: PayloadAction<JobApplication>) => {
      state.isInterviewModalOpen = true;
      state.jobForInterviewModal = action.payload;
    },
    closeInterviewModal: (state) => {
      state.isInterviewModalOpen = false;
      state.jobForInterviewModal = null;
    },

    openOfferModal: (state, action: PayloadAction<JobApplication>) => {
      state.isOfferModalOpen = true;
      state.jobForOfferModal = action.payload;
    },
    closeOfferModal: (state) => {
      state.isOfferModalOpen = false;
      state.jobForOfferModal = null;
    },
  },
});

export const {
    openJobFormModal,
    closeJobFormModal,
    setEditingJob,
    openCustomFieldModal,
    closeCustomFieldModal,
    openDescriptionModal,
    closeDescriptionModal,
    openInterviewModal,
    closeInterviewModal,
    openOfferModal,
    closeOfferModal,
} = uiSlice.actions;

export default uiSlice.reducer;

// --- Memoized Selectors ---
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const selectUIState = (state: RootState) => state.ui;
export const selectIsJobFormModalOpen = createSelector(selectUIState, (ui) => ui.isJobFormModalOpen);
export const selectIsInterviewModalOpen = createSelector(selectUIState, (ui) => ui.isInterviewModalOpen);
export const selectIsOfferModalOpen = createSelector(selectUIState, (ui) => ui.isOfferModalOpen);
export const selectIsDescriptionModalOpen = createSelector(selectUIState, (ui) => ui.isDescriptionModalOpen);
export const selectIsCustomFieldModalOpen = createSelector(selectUIState, (ui) => ui.isCustomFieldModalOpen);
export const selectEditingJob = createSelector(selectUIState, (ui) => ui.editingJob);
export const selectJobForDescriptionModal = createSelector(selectUIState, (ui) => ui.jobForDescriptionModal);
export const selectJobForInterviewModal = createSelector(selectUIState, (ui) => ui.jobForInterviewModal);
export const selectJobForOfferModal = createSelector(selectUIState, (ui) => ui.jobForOfferModal);
