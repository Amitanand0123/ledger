import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterState {
    search: string;
    location: string;
    dateRange: string; // Will store a JSON string of DateRange object
    status: string; // Changed from enum to string
    salaryMin: string;
    salaryMax: string;
}

const initialState: FilterState = {
    search: '',
    location: '',
    dateRange: '',
    status: 'ALL',
    salaryMin: '',
    salaryMax: '',
};

const filterSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
        },
        setLocation: (state, action: PayloadAction<string>) => {
            state.location = action.payload;
        },
        setDateRange: (state, action: PayloadAction<string>) => {
            state.dateRange = action.payload;
        },
        setStatus: (state, action: PayloadAction<string>) => {
            state.status = action.payload;
        },
        setSalaryRange: (state, action: PayloadAction<{ min: string, max: string }>) => {
            state.salaryMin = action.payload.min;
            state.salaryMax = action.payload.max;
        },
        clearFilters: (state) => {
            state.search = '';
            state.location = '';
            state.dateRange = '';
            state.status = 'ALL';
            state.salaryMin = '';
            state.salaryMax = '';
        },
    },
});

export const { 
    setSearch, 
    setLocation, 
    setDateRange, 
    setStatus, 
    setSalaryRange, 
    clearFilters, 
} = filterSlice.actions;

export default filterSlice.reducer;