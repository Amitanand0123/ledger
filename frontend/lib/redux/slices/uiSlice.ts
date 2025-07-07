import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobApplication } from '@/lib/types';

interface UIState {
  isJobFormModalOpen: boolean;
  isJobDetailsModalOpen: boolean;
  isCustomFieldModalOpen: boolean;
  isDescriptionModalOpen: boolean; // New state for the description modal
  editingJob: JobApplication | null;
  viewingJob: JobApplication | null;
  jobForDescriptionModal: JobApplication | null; // New state to hold the job for the modal
}

const initialState: UIState = {
  isJobFormModalOpen: false,
  isJobDetailsModalOpen: false,
  isCustomFieldModalOpen: false,
  isDescriptionModalOpen: false,
  editingJob: null,
  viewingJob: null,
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
    
    openJobDetailsModal: (state) => {
        state.isJobDetailsModalOpen = true;
    },
    closeJobDetailsModal: (state) => {
        state.isJobDetailsModalOpen = false;
        state.viewingJob = null;
    },
    setViewingJob: (state, action: PayloadAction<JobApplication | null>) => {
        state.viewingJob = action.payload;
    },

    openCustomFieldModal: (state) => {
        state.isCustomFieldModalOpen = true;
    },
    closeCustomFieldModal: (state) => {
        state.isCustomFieldModalOpen = false;
    },

    // New actions for the Description Modal
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
    openJobDetailsModal, 
    closeJobDetailsModal, 
    setViewingJob,
    openCustomFieldModal,
    closeCustomFieldModal,
    openDescriptionModal, // Export new action
    closeDescriptionModal, // Export new action
} = uiSlice.actions;

export default uiSlice.reducer;