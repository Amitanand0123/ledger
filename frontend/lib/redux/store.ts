import { configureStore } from '@reduxjs/toolkit';
import uiSlice from './slices/uiSlice';
import filterSlice from './slices/filterSlice';
import guestJobsSlice from './slices/guestJobsSlice';
import { jobsApiSlice } from './slices/jobsApiSlice';
import { customFieldsApiSlice } from './slices/customFieldsApiSlice';
import { documentApiSlice } from './slices/documentApiSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      ui: uiSlice,
      filters: filterSlice,
      guestJobs: guestJobsSlice,
      [jobsApiSlice.reducerPath]: jobsApiSlice.reducer,
      [customFieldsApiSlice.reducerPath]: customFieldsApiSlice.reducer,
      [documentApiSlice.reducerPath]: documentApiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(jobsApiSlice.middleware)
        .concat(customFieldsApiSlice.middleware)
        .concat(documentApiSlice.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];