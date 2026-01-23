# AI-Powered Smart Provision Shop Management System

A comprehensive web-based shop assistant that helps shop owners manage their business with AI-powered insights.

## Features

### Core Features (Phase 1)
- ✅ **Sales Recording**: Simple UI to record daily sales with item name, quantity, and price
- ✅ **Stock & Inventory Tracking**: Track current stock levels with automatic low-stock alerts
- ✅ **Profit & Sales Summary Dashboard**: Visual charts showing daily/weekly/monthly profits and best-selling items
- ✅ **AI Shop Assistant**: Chat interface to ask questions about sales, stock, and business insights

### AI Features
- ✅ **Sales Trend Analysis**: Detects fast-moving goods and seasonal patterns
- ✅ **Smart Restock Recommendations**: Based on sales frequency and stock levels
- ✅ **Business Insight Generator**: Plain-language insights about profit and sales patterns

## Tech Stack

### Backend
- Python 3.9+
- FastAPI
- SQLAlchemy (SQLite/PostgreSQL)
- OpenAI API (GPT-4)
- Pandas for data analysis

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Recharts for data visualization
- Mobile-responsive design

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file:
```bash
cp .env.example .env
```

5. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=sqlite:///./shop.db
```

6. Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Usage

1. **Add Items to Stock**: Go to the Stock page and add items with their stock levels, prices, and low-stock thresholds.

2. **Record Sales**: Use the Record Sale page to log daily sales. Stock is automatically reduced when sales are recorded.

3. **View Dashboard**: Check the dashboard for profit summaries, sales trends, and low-stock alerts.

4. **Ask AI Assistant**: Use the AI Assistant page to ask questions like:
   - "What should I restock this week?"
   - "Which items sell the most?"
   - "How much profit did I make last month?"

## Deployment

### Backend (Render/Railway)
- Set environment variables in your hosting platform
- Point to PostgreSQL database (update DATABASE_URL)
- Deploy using the provided requirements.txt

### Frontend (Vercel)
- Connect your GitHub repository
- Set `NEXT_PUBLIC_API_URL` to your backend URL
- Deploy automatically on push

## Future Enhancements (Phase 2)
- Voice input for sales recording
- WhatsApp daily sales summary
- Receipt generation
- Multi-user support
- Advanced analytics and forecasting

## License

MIT License
