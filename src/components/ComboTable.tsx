import React from 'react';
import type { Combo } from '../types/index';

interface ComboTableProps {
  combos: Combo[];
}

export const ComboTable: React.FC<ComboTableProps> = ({ combos }) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof Combo;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedCombos = React.useMemo(() => {
    if (!sortConfig) return combos;

    return [...combos].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [combos, sortConfig]);

  const handleSort = (key: keyof Combo) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'desc' };
    });
  };

  const totalNetRealized = combos.reduce((sum, combo) => sum + combo.netRealized, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getSortIcon = (key: keyof Combo) => {
    if (sortConfig?.key !== key) return '⇅';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (combos.length === 0) {
    return (
      <div className="empty-state">
        <p>No realized combos found. Upload an IBKR Activity Statement to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="combo-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} title="The full name of the options combination, including underlying, expiry, strike, and type.">
              Combo (Full Name) {getSortIcon('name')}
            </th>
            <th onClick={() => handleSort('strategy')} title="The detected options strategy (e.g., Short Put, Iron Condor, Vertical Spread).">
              Strategy {getSortIcon('strategy')}
            </th>
            <th onClick={() => handleSort('entryType')} title="Indicates whether the position was opened as a Credit (receiving money) or Debit (paying money).">
              Entry Type {getSortIcon('entryType')}
            </th>
            <th onClick={() => handleSort('entryAmount')} title="The total amount received or paid when opening the position (excluding commissions).">
              Entry Amount ($) {getSortIcon('entryAmount')}
            </th>
            <th onClick={() => handleSort('creditDay')} title="Total premium received (credit) during the life of the trade.">
              Credit (Day) {getSortIcon('creditDay')}
            </th>
            <th onClick={() => handleSort('debitDay')} title="Total premium paid (debit) during the life of the trade.">
              Debit (Day) {getSortIcon('debitDay')}
            </th>
            <th onClick={() => handleSort('commission')} title="Total IBKR fees paid for all legs in this combo.">
              Commission ($) {getSortIcon('commission')}
            </th>
            <th onClick={() => handleSort('netRealized')} title="Final profit or loss after all legs are closed and commissions are deducted.">
              Net Realized ($) {getSortIcon('netRealized')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCombos.map((combo) => (
            <tr key={combo.id}>
              <td className="combo-name">{combo.name}</td>
              <td>{combo.strategy}</td>
              <td>
                <span className={`entry-type ${combo.entryType.toLowerCase()}`}>
                  {combo.entryType}
                </span>
              </td>
              <td className="currency">{formatCurrency(combo.entryAmount)}</td>
              <td>{combo.creditDay}</td>
              <td>{combo.debitDay}</td>
              <td className="currency">{formatCurrency(combo.commission)}</td>
              <td className={`currency ${combo.netRealized >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(combo.netRealized)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7} className="total-label">
              <strong>Total Net Realized</strong>
            </td>
            <td className={`currency total ${totalNetRealized >= 0 ? 'profit' : 'loss'}`}>
              <strong>{formatCurrency(totalNetRealized)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
