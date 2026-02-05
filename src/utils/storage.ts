import type { Combo, Filters } from '../types/index';

const STORAGE_KEY = 'ibkr_options_combos';

export const saveCombos = (combos: Combo[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combos));
  } catch (error) {
    console.error('Error saving combos to localStorage:', error);
  }
};

export const loadCombos = (): Combo[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading combos from localStorage:', error);
    return [];
  }
};

const FILTERS_KEY = 'ibkr_options_filters';

export const saveFilters = (filters: Filters): void => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Error saving filters to localStorage:', error);
  }
};

export const loadFilters = (): Filters => {
  try {
    const data = localStorage.getItem(FILTERS_KEY);
    return data ? JSON.parse(data) : { period: 'all' };
  } catch (error) {
    console.error('Error loading filters from localStorage:', error);
    return { period: 'all' };
  }
};

export const clearCombos = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FILTERS_KEY);
  } catch (error) {
    console.error('Error clearing data from localStorage:', error);
  }
};
