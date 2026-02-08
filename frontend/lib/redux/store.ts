import { configureStore } from '@reduxjs/toolkit';
import uiSlice from './slices/uiSlice';
import filterSlice from './slices/filterSlice';
import guestJobsSlice from './slices/guestJobsSlice';
import { jobsApiSlice } from './slices/jobsApiSlice';
import { customFieldsApiSlice } from './slices/customFieldsApiSlice';
import { documentApiSlice } from './slices/documentApiSlice';
import { userApiSlice } from './slices/userApiSlice';
import { agentApiSlice } from './slices/agentApiSlice';
import { statsApiSlice } from './slices/statsApiSlice';
import { platformApiSlice } from './slices/platformApiSlice';
import { sharingApiSlice } from './slices/sharingApiSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      ui: uiSlice,
      filters: filterSlice,
      guestJobs: guestJobsSlice,
      [jobsApiSlice.reducerPath]: jobsApiSlice.reducer,
      [customFieldsApiSlice.reducerPath]: customFieldsApiSlice.reducer,
      [documentApiSlice.reducerPath]: documentApiSlice.reducer,
      [userApiSlice.reducerPath]: userApiSlice.reducer,
      [agentApiSlice.reducerPath]: agentApiSlice.reducer,
      [statsApiSlice.reducerPath]: statsApiSlice.reducer,
      [platformApiSlice.reducerPath]: platformApiSlice.reducer,
      [sharingApiSlice.reducerPath]: sharingApiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(jobsApiSlice.middleware)
        .concat(customFieldsApiSlice.middleware)
        .concat(documentApiSlice.middleware)
        .concat(userApiSlice.middleware)
        .concat(agentApiSlice.middleware)
        .concat(statsApiSlice.middleware)
        .concat(platformApiSlice.middleware)
        .concat(sharingApiSlice.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];