import { useDispatch, useSelector, useStore } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch, AppStore } from './store';

/**
 * A pre-typed version of the `useDispatch` hook.
 * Using this ensures that the `dispatch` function is correctly typed with all your thunks and actions.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * A pre-typed version of the `useSelector` hook.
 * Using this ensures that the `state` object within your selector functions is correctly typed as `RootState`,
 * providing full autocompletion for your entire state tree.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * A pre-typed version of the `useStore` hook.
 * This is less commonly used but provides typed access to the entire Redux store instance if needed.
 */
export const useAppStore: () => AppStore = useStore;