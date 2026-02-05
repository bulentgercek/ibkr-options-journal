# 📊 IBKR Options Journal

A professional React + TypeScript application for tracking realized P&L from Interactive Brokers options combos. Similar to cTrader's History/Realized P&L view.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Vite](https://img.shields.io/badge/Vite-7-646cff)

## ✨ Features

- 📁 **CSV Upload**: Drag-and-drop IBKR Activity Statement files
- 🎯 **Realized Trades Only**: Automatically filters out open positions
- 🔄 **Smart Combo Grouping**: Groups option legs into spreads, iron condors, etc.
- 📊 **Professional Table**: Sortable columns with profit/loss color coding
- 🔍 **Advanced Filters**: Filter by date range, underlying, and strategy
- 💾 **Data Persistence**: localStorage keeps your data between sessions
- 📥 **CSV Export**: Export filtered data for further analysis
- 🎨 **Modern UI**: Clean dark theme with responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Navigate to project directory
cd ibkr-options-journal

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📖 Usage

1. **Upload CSV**: Click or drag your IBKR Activity Statement CSV file
2. **View Combos**: See all realized options combos in the table
3. **Filter Data**: Use date range, underlying, or strategy filters
4. **Export**: Download filtered data as CSV
5. **Persist**: Data automatically saves to browser storage

## 📊 Table Columns

| Column | Description |
|--------|-------------|
| **Combo (Full Name)** | Full description of the options combo |
| **Strategy** | Detected strategy type (Call Spread, Put Spread, Iron Condor, etc.) |
| **Entry Type** | Credit or Debit entry |
| **Entry Amount ($)** | Initial entry amount |
| **Credit (Day)** | Date credit was received |
| **Debit (Day)** | Date debit was paid |
| **Commission ($)** | Total commissions paid |
| **Net Realized ($)** | Final P&L after commissions |

## 🧪 Testing

A sample CSV file is included: `sample-data.csv`

Test scenarios:
- SPY Call Spread (realized)
- AAPL Put Spread (realized)
- TSLA Single Call (realized)

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── FileUpload.tsx   # CSV upload with drag-and-drop
│   ├── ComboTable.tsx   # Data table with sorting
│   ├── Filters.tsx      # Filter controls
│   └── ExportButton.tsx # CSV export
├── types/               # TypeScript interfaces
│   └── index.ts
├── utils/               # Utilities
│   ├── csvParser.ts     # CSV parsing & combo logic
│   └── storage.ts       # localStorage utilities
├── App.tsx              # Main application
├── App.css              # Styling
└── main.tsx             # Entry point
```

## 🔧 Configuration

### CSV Format
The parser expects IBKR Activity Statement CSV with these columns:
- `Asset Category` - Must contain "option"
- `Symbol` - Option symbol (e.g., "SPY 240315C00500000")
- `Date/Time` or `Date` - Trade date
- `Quantity` - Signed quantity
- `Proceeds` - Trade proceeds
- `Comm/Fee` - Commission paid

### Customization
Edit `src/utils/csvParser.ts` to support different CSV formats or column names.

## 📦 Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready for deployment.

## 🌐 Deployment

Deploy to any static hosting service:
- **Netlify**: Drag `dist/` folder or connect GitHub
- **Vercel**: Import project from GitHub
- **GitHub Pages**: Use `gh-pages` package
- **Any Web Host**: Upload `dist/` folder

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **CSV Parsing**: PapaParse
- **Date Handling**: date-fns
- **Storage**: Browser localStorage
- **Styling**: Custom CSS

## 📝 Notes

### Limitations
- localStorage limited to ~5-10MB
- Data stored locally (no multi-device sync)
- Assumes standard IBKR CSV format

### Future Enhancements
- Backend database for unlimited storage
- Multi-device sync
- Advanced analytics (win rate, strategy performance)
- Chart visualizations
- Support for other broker formats

## 📄 License

MIT License - feel free to use and modify as needed.

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

**Made with ❤️ for options traders**
