import React from 'react';
import type { Filters as FilterType } from '../types/index';
import { 
  format, 
  startOfDay, 
  subDays, 
  startOfWeek, 
  startOfMonth, 
  subMonths, 
  endOfMonth 
} from 'date-fns';

interface FiltersProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  availableUnderlyings: string[];
  availableStrategies: string[];
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  availableUnderlyings,
  availableStrategies,
}) => {
  const handlePeriodChange = (period: string) => {
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined = today;

    switch (period) {
      case 'today':
        from = startOfDay(today);
        break;
      case 'yesterday':
        from = startOfDay(subDays(today, 1));
        to = startOfDay(subDays(today, 1));
        break;
      case 'currentWeek':
        from = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        break;
      case 'currentMonth':
        from = startOfMonth(today);
        break;
      case 'previousMonth':
        from = startOfMonth(subMonths(today, 1));
        to = endOfMonth(subMonths(today, 1));
        break;
      case 'last3Months':
        from = subMonths(today, 3);
        break;
      case 'last6Months':
        from = subMonths(today, 6);
        break;
      case 'last12Months':
        from = subMonths(today, 12);
        break;
      case 'all':
        from = undefined;
        to = undefined;
        break;
      default:
        return;
    }

    onFilterChange({
      ...filters,
      period,
      dateFrom: from ? format(from, 'yyyy-MM-dd') : undefined,
      dateTo: to ? format(to, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleChange = (key: keyof FilterType, value: string) => {
    onFilterChange({
      ...filters,
      period: key === 'dateFrom' || key === 'dateTo' ? undefined : filters.period,
      [key]: value || undefined,
    });
  };

  const handleClear = () => {
    onFilterChange({ period: 'all' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v) && filters.period !== 'all';

  return (
    <div className="filters">
      <div className="filter-group">
        <label htmlFor="period">Quick Period</label>
        <select
          id="period"
          onChange={(e) => handlePeriodChange(e.target.value)}
          value={filters.period || 'all'}
        >
          <option value="all">All History</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="currentWeek">Current Week</option>
          <option value="currentMonth">Current Month</option>
          <option value="previousMonth">Previous Month</option>
          <option value="last3Months">Last 3 Months</option>
          <option value="last6Months">Last 6 Months</option>
          <option value="last12Months">Last 12 Months</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="dateFrom">From Date</label>
        <input
          id="dateFrom"
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleChange('dateFrom', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="dateTo">To Date</label>
        <input
          id="dateTo"
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => handleChange('dateTo', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="underlying">Underlying</label>
        <select
          id="underlying"
          value={filters.underlying || ''}
          onChange={(e) => handleChange('underlying', e.target.value)}
        >
          <option value="">All Symbols</option>
          {availableUnderlyings.map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="strategy">Strategy</label>
        <select
          id="strategy"
          value={filters.strategy || ''}
          onChange={(e) => handleChange('strategy', e.target.value)}
        >
          <option value="">All Strategies</option>
          {availableStrategies.map((strategy) => (
            <option key={strategy} value={strategy}>
              {strategy}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button className="clear-filters-btn" onClick={handleClear}>
          Clear Filters
        </button>
      )}
    </div>
  );
};
