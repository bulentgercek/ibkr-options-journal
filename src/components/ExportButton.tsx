import React from 'react';
import type { Combo } from '../types/index';
import { format } from 'date-fns';

interface ExportButtonProps {
  combos: Combo[];
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ combos, disabled }) => {
  const handleExport = () => {
    if (combos.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content
    const headers = [
      'Combo (Full Name)',
      'Strategy',
      'Entry Type',
      'Entry Amount ($)',
      'Open (Day)',
      'Close (Day)',
      'Commission ($)',
      'Net Realized ($)',
    ];

    const rows = combos.map((combo) => [
      combo.name,
      combo.strategy,
      combo.entryType,
      combo.entryAmount.toFixed(2),
      combo.openDate,
      combo.closeDate,
      combo.commission.toFixed(2),
      combo.netRealized.toFixed(2),
    ]);

    // Add total row
    const totalNetRealized = combos.reduce((sum, c) => sum + c.netRealized, 0);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Total Net Realized',
      totalNetRealized.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `ibkr-realized-pnl-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      className="export-btn"
      onClick={handleExport}
      disabled={disabled || combos.length === 0}
    >
      📥 Export to CSV
    </button>
  );
};
