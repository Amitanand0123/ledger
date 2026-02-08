import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobApplication } from '@/lib/types';

interface UIState {
  isJobFormModalOpen: boolean;
  isCustomFieldModalOpen: boolean;
  isDescriptionModalOpen: boolean;
  editingJob: JobApplication | null;
  jobForDescriptionModal: JobApplication | null;
}

const initialState: UIState = {
  isJobFormModalOpen: false,
  isCustomFieldModalOpen: false,
  isDescriptionModalOpen: false,
  editingJob: null,
  jobForDescriptionModal: null,
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
} = uiSlice.actions;

export default uiSlice.reducer;
