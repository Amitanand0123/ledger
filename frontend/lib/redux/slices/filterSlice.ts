import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterState {
    search: string;
    location: string;
    dateRange: string;
    status: string;
    salaryMin: string;
    salaryMax: string;
    page: number;
    limit: number;
}

const initialState: FilterState = {
    search: '',
    location: '',
    dateRange: '',
    status: 'ALL',
    salaryMin: '',
    salaryMax: '',
    page: 1,
    limit: 20,
};

const filterSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
            state.page = 1;
        },
        setLocation: (state, action: PayloadAction<string>) => {
            state.location = action.payload;
            state.page = 1;
        },
        setDateRange: (state, action: PayloadAction<string>) => {
            state.dateRange = action.payload;
            state.page = 1;
        },
        setStatus: (state, action: PayloadAction<string>) => {
            state.status = action.payload;
            state.page = 1;
        },
        setSalaryRange: (state, action: PayloadAction<{ min: string, max: string }>) => {
            state.salaryMin = action.payload.min;
            state.salaryMax = action.payload.max;
            state.page = 1;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
        },
        setLimit: (state, action: PayloadAction<number>) => {
            state.limit = action.payload;
            state.page = 1;
        },
        clearFilters: (state) => {
            state.search = '';
            state.location = '';
            state.dateRange = '';
            state.status = 'ALL';
            state.salaryMin = '';
            state.salaryMax = '';
            state.page = 1;
        },
    },
});

export const {
    setSearch,
    setLocation,
    setDateRange,
    setStatus,
    setSalaryRange,
    setPage,
    setLimit,
    clearFilters,
} = filterSlice.actions;

export default filterSlice.reducer;

// --- Memoized Selectors ---
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const selectFilterState = (state: RootState) => state.filters;
export const selectSearch = createSelector(selectFilterState, (f) => f.search);
export const selectStatus = createSelector(selectFilterState, (f) => f.status);
export const selectLocation = createSelector(selectFilterState, (f) => f.location);
export const selectDateRange = createSelector(selectFilterState, (f) => f.dateRange);
export const selectSalaryRange = createSelector(selectFilterState, (f) => ({ min: f.salaryMin, max: f.salaryMax }));
export const selectPage = createSelector(selectFilterState, (f) => f.page);
export const selectLimit = createSelector(selectFilterState, (f) => f.limit);
export const selectFilters = selectFilterState;
