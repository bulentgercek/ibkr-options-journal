import { useState, useEffect, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { ComboTable } from './components/ComboTable';
import { Filters } from './components/Filters';
import { ExportButton } from './components/ExportButton';
import type { Combo, Filters as FilterType } from './types/index';
import { parseCSV, filterRealizedTrades, groupIntoCombos } from './utils/csvParser';
import { saveCombos, loadCombos, clearCombos, saveFilters, loadFilters } from './utils/storage';
import './App.css';

function App() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [filters, setFilters] = useState<FilterType>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCombos = loadCombos();
    const savedFilters = loadFilters();
    
    if (savedCombos.length > 0) {
      setCombos(savedCombos);
    }
    setFilters(savedFilters);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (combos.length > 0) {
      saveCombos(combos);
    }
    saveFilters(filters);
  }, [combos, filters]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse CSV
      const trades = await parseCSV(file);
      
      if (trades.length === 0) {
        setError('No options trades found in the CSV file. Please check the file format.');
        setIsLoading(false);
        return;
      }

      // Filter to only realized trades
      const realizedTrades = filterRealizedTrades(trades);
      
      if (realizedTrades.length === 0) {
        setError('No realized (closed) options positions found in the CSV file.');
        setIsLoading(false);
        return;
      }

      // Group into combos
      const newCombos = groupIntoCombos(realizedTrades);
      
      setCombos(newCombos);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing CSV:', err);
      setError('Error processing CSV file. Please ensure it\'s a valid IBKR Activity Statement.');
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setCombos([]);
      setFilters({});
      clearCombos();
    }
  };

  // Filter combos based on current filters
  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      if (filters.dateFrom && combo.closeDate < filters.dateFrom) return false;
      if (filters.dateTo && combo.closeDate > filters.dateTo) return false;
      if (filters.underlying && combo.underlying !== filters.underlying) return false;
      if (filters.strategy && combo.strategy !== filters.strategy) return false;
      return true;
    });
  }, [combos, filters]);

  // Get unique values for filter dropdowns
  const availableUnderlyings = useMemo(() => {
    return [...new Set(combos.map((c) => c.underlying))].sort();
  }, [combos]);

  const availableStrategies = useMemo(() => {
    return [...new Set(combos.map((c) => c.strategy))].sort();
  }, [combos]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 <span>IBKR Options Journal</span></h1>
        <p className="subtitle">Track your realized options P&L</p>
      </header>

      <main className="app-main">
        {combos.length === 0 ? (
          <div className="upload-section">
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            {error && <div className="error-message">{error}</div>}
          </div>
        ) : (
          <>
            <div className="controls">
              <Filters
                filters={filters}
                onFilterChange={setFilters}
                availableUnderlyings={availableUnderlyings}
                availableStrategies={availableStrategies}
              />
              
              <div className="action-buttons">
                <ExportButton combos={filteredCombos} />
                <button className="upload-new-btn" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>
                  📁 Upload New CSV
                </button>
                <button className="clear-data-btn" onClick={handleClearData}>
                  🗑️ Clear Data
                </button>
              </div>
              
              <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="stats">
              <div className="stat-card">
                <div className="stat-label">Total Combos</div>
                <div className="stat-value">{filteredCombos.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Net Realized P&L</div>
                <div className={`stat-value ${filteredCombos.reduce((sum, c) => sum + c.netRealized, 0) >= 0 ? 'profit' : 'loss'}`}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(filteredCombos.reduce((sum, c) => sum + c.netRealized, 0))}
                </div>
              </div>
            </div>

            <ComboTable combos={filteredCombos} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>IBKR Options Journal - Realized P&L Tracker</p>
      </footer>
    </div>
  );
}

export default App;
