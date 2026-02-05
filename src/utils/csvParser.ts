import Papa from 'papaparse';
import type { Trade, Combo, ComboMetrics } from '../types/index';
import { format } from 'date-fns';


export const parseCSV = (file: File): Promise<Trade[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const trades = extractOptionsTrades(results.data);
          resolve(trades);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

const extractOptionsTrades = (rows: string[][]): Trade[] => {
  const trades: Trade[] = [];
  let currentHeaders: string[] = [];

  for (const row of rows) {
    // IBKR CSV has sections. Each section has Header and Data rows.
    // We are interested in the 'Trades' section.
    if (row[0] === 'Trades') {
      if (row[1] === 'Header') {
        currentHeaders = row;
        continue;
      }

      if (row[1] === 'Data' && (row[2] === 'Order' || row[2] === 'Trade')) {
        // Map row to data using headers
        const data: Record<string, string> = {};
        currentHeaders.forEach((header, index) => {
          data[header] = row[index];
        });

        const assetCategory = data['Asset Category'] || '';
        if (assetCategory.toLowerCase().includes('option')) {
          const symbol = data['Symbol'] || '';
          const dateStr = data['Date/Time'] || '';
          const quantity = parseFloat(data['Quantity'] || '0');
          const proceeds = parseFloat(data['Proceeds'] || '0');
          const tPrice = parseFloat(data['T. Price'] || '0');
          const commission = Math.abs(parseFloat(data['Comm/Fee'] || '0'));

          const optionInfo = parseOptionSymbol(symbol);
          if (optionInfo && dateStr) {
            trades.push({
              date: formatDate(dateStr),
              symbol: symbol.trim(),
              underlying: optionInfo.underlying,
              quantity,
              price: tPrice,
              commission,
              type: optionInfo.type,
              strike: optionInfo.strike,
              expiry: optionInfo.expiry,
              action: quantity > 0 ? 'BUY' : 'SELL',
              proceeds,
            });
          }
        }
      }
    }
  }

  return trades;
};

const parseOptionSymbol = (symbol: string): { underlying: string; type: 'CALL' | 'PUT'; strike: number; expiry: string } | null => {
  const cleaned = symbol.replace(/\s+/g, ' ').trim();

  // Format 1: OSI Format (e.g., "SPY 240315C00500000")
  const osiMatch = cleaned.match(/^([A-Z]+)\s+(\d{6})([CP])(\d+)$/);
  if (osiMatch) {
    const [, underlying, dateStr, callPut, strikeStr] = osiMatch;
    const year = 2000 + parseInt(dateStr.substring(0, 2));
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    const expiry = `${year}-${month}-${day}`;
    const strike = parseInt(strikeStr) / 1000;

    return {
      underlying,
      type: callPut === 'C' ? 'CALL' : 'PUT',
      strike,
      expiry,
    };
  }

  // Format 2: Human Readable (e.g., "DE 15JAN27 300 P" or "SPXW 27JAN26 6845 P")
  const hrMatch = cleaned.match(/^([A-Z.0-9]+)\s+(\d{2})([A-Z]{3})(\d{2})\s+([\d.]+)\s+([CP])$/);
  if (hrMatch) {
    const [, underlying, day, monthName, yearShort, strikeStr, typeChar] = hrMatch;
    
    const months: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
    };
    
    const year = 2000 + parseInt(yearShort);
    const month = months[monthName.toUpperCase()] || '01';
    const expiry = `${year}-${month}-${day}`;
    const strike = parseFloat(strikeStr);

    return {
      underlying,
      type: typeChar === 'C' ? 'CALL' : 'PUT',
      strike,
      expiry,
    };
  }

  // Format 3: Human Readable with more spaces or slightly different (e.g., "AAPL 06JUN25 220 P")
  const hrMatch2 = cleaned.match(/^([A-Z.0-9]+)\s+(\d{2}[A-Z]{3}\d{2})\s+([\d.]+)\s+([CP])$/);
  if (hrMatch2) {
      const [, underlying, datePart, strikeStr, typeChar] = hrMatch2;
      const day = datePart.substring(0, 2);
      const monthName = datePart.substring(2, 5);
      const yearShort = datePart.substring(5, 7);

      const months: Record<string, string> = {
          JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
          JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
      };

      const year = 2000 + parseInt(yearShort);
      const month = months[monthName.toUpperCase()] || '01';
      const expiry = `${year}-${month}-${day}`;
      const strike = parseFloat(strikeStr);

      return {
          underlying,
          type: typeChar === 'C' ? 'CALL' : 'PUT',
          strike,
          expiry,
      };
  }

  return null;
};

const formatDate = (dateStr: string): string => {
  // Handle various date formats from IBKR
  // "2024-03-15", "2024-03-15, 09:30:00", "03/15/2024"
  try {
    const cleaned = dateStr.split(',')[0].trim();
    
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return cleaned;
    }
    
    // If in MM/DD/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [month, day, year] = cleaned.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // Try parsing as date
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return format(date, 'yyyy-MM-dd');
    }
    
    return cleaned;
  } catch {
    return dateStr;
  }
};

export const filterRealizedTrades = (trades: Trade[]): Trade[] => {
  // Group trades by underlying + expiry + strike + type
  const positionMap = new Map<string, number>();
  const realizedTrades: Trade[] = [];
  
  for (const trade of trades) {
    const key = `${trade.underlying}_${trade.expiry}_${trade.strike}_${trade.type}`;
    const currentPosition = positionMap.get(key) || 0;
    const newPosition = currentPosition + trade.quantity;
    
    positionMap.set(key, newPosition);
    
    // If this trade closes or partially closes a position, it's realized
    if ((currentPosition > 0 && trade.quantity < 0) || 
        (currentPosition < 0 && trade.quantity > 0) ||
        newPosition === 0) {
      realizedTrades.push(trade);
    } else if (currentPosition === 0 && trade.quantity !== 0) {
      // Opening trade - include it as it will be part of a combo
      realizedTrades.push(trade);
    }
  }
  
  // Filter to only include trades where final position is 0 (fully closed)
  const finalPositions = new Map<string, number>();
  for (const trade of trades) {
    const key = `${trade.underlying}_${trade.expiry}_${trade.strike}_${trade.type}`;
    finalPositions.set(key, (finalPositions.get(key) || 0) + trade.quantity);
  }
  
  return realizedTrades.filter(trade => {
    const key = `${trade.underlying}_${trade.expiry}_${trade.strike}_${trade.type}`;
    return Math.abs(finalPositions.get(key) || 0) < 0.01; // Account for floating point
  });
};

export const groupIntoCombos = (trades: Trade[]): Combo[] => {
  // Group trades by underlying and approximate close date
  const comboGroups = new Map<string, Trade[]>();
  
  for (const trade of trades) {
    // Group by underlying and expiry
    const key = `${trade.underlying}_${trade.expiry}`;
    const group = comboGroups.get(key) || [];
    group.push(trade);
    comboGroups.set(key, group);
  }
  
  const combos: Combo[] = [];
  let comboId = 1;
  
  for (const [, groupTrades] of comboGroups) {
    // Sort by date
    groupTrades.sort((a, b) => a.date.localeCompare(b.date));
    
    // Determine strategy
    const strategy = determineStrategy(groupTrades);
    const metrics = calculateComboMetrics(groupTrades);
    
    // Get dates
    const dates = groupTrades.map(t => t.date).sort();
    const openDate = dates[0];
    const closeDate = dates[dates.length - 1];
    
    // Determine credit/debit days
    const creditTrades = groupTrades.filter(t => t.proceeds > 0);
    const debitTrades = groupTrades.filter(t => t.proceeds < 0);
    const creditDay = creditTrades.length > 0 ? creditTrades[0].date : openDate;
    const debitDay = debitTrades.length > 0 ? debitTrades[debitTrades.length - 1].date : closeDate;
    
    combos.push({
      id: `combo_${comboId++}`,
      name: generateComboName(groupTrades),
      strategy,
      underlying: groupTrades[0].underlying,
      entryType: metrics.entryType,
      entryAmount: metrics.entryAmount,
      creditDay,
      debitDay,
      commission: metrics.totalCommission,
      netRealized: metrics.netRealized,
      legs: groupTrades,
      openDate,
      closeDate,
    });
  }
  
  return combos;
};

const determineStrategy = (trades: Trade[]): string => {
  // Group trades by strike and type to count unique legs
  const uniqueLegs = new Map<string, number>();
  for (const t of trades) {
    const key = `${t.strike}_${t.type}`;
    uniqueLegs.set(key, (uniqueLegs.get(key) || 0) + t.quantity);
  }

  // Filter out any legs that net to zero
  const activeLegs = Array.from(uniqueLegs.keys());
  const numLegs = activeLegs.length;

  const calls = activeLegs.filter(key => key.endsWith('_CALL'));
  const puts = activeLegs.filter(key => key.endsWith('_PUT'));

  if (numLegs === 1) {
    return activeLegs[0].endsWith('_CALL') ? 'Single Call' : 'Single Put';
  }

  if (numLegs === 2) {
    if (calls.length === 2) return 'Call Spread';
    if (puts.length === 2) return 'Put Spread';
    if (calls.length === 1 && puts.length === 1) {
      const strikes = activeLegs.map(k => parseFloat(k.split('_')[0]));
      return strikes[0] === strikes[1] ? 'Straddle' : 'Strangle';
    }
  }

  if (numLegs === 4) {
    if (calls.length === 2 && puts.length === 2) return 'Iron Condor';
    if (calls.length === 4) return 'Call Condor';
    if (puts.length === 4) return 'Put Condor';
  }

  return numLegs > 2 ? 'Multi-leg Combo' : 'Complex Strategy';
};

const generateComboName = (trades: Trade[]): string => {
  const underlying = trades[0].underlying;
  const strikes = [...new Set(trades.map(t => t.strike))].sort((a, b) => a - b);
  const types = [...new Set(trades.map(t => t.type))];
  
  if (trades.length === 1) {
    return `${underlying} ${trades[0].strike} ${trades[0].type}`;
  }
  
  if (strikes.length === 2 && types.length === 1) {
    return `${underlying} ${strikes[0]}/${strikes[1]} ${types[0]} Spread`;
  }
  
  if (strikes.length === 4) {
    return `${underlying} ${strikes[0]}/${strikes[1]}/${strikes[2]}/${strikes[3]} Iron Condor`;
  }
  
  return `${underlying} ${strikes.join('/')} Combo`;
};

export const calculateComboMetrics = (trades: Trade[]): ComboMetrics => {
  const totalProceeds = trades.reduce((sum, t) => sum + t.proceeds, 0);
  const totalCommission = trades.reduce((sum, t) => sum + t.commission, 0);
  const netRealized = totalProceeds - totalCommission;
  
  // Find the opening date (earliest trade date)
  const sortedDates = [...new Set(trades.map(t => t.date))].sort();
  const openDate = sortedDates[0];
  
  // Sum proceeds only for trades on the opening date
  const openingProceeds = trades
    .filter(t => t.date === openDate)
    .reduce((sum, t) => sum + t.proceeds, 0);
  
  const entryType = openingProceeds > 0 ? 'Credit' : 'Debit';
  const entryAmount = Math.abs(openingProceeds);
  
  return {
    totalProceeds,
    totalCommission,
    netRealized,
    entryType,
    entryAmount,
  };
};
