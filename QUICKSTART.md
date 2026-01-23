# Quick Start Guide

Get your AI-Powered Shop Management System up and running in minutes!

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- OpenAI API key (get one at https://platform.openai.com/api-keys)

## Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy .env.example to .env and add your OpenAI API key
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env

# Edit .env file and add:
# OPENAI_API_KEY=your_key_here

# Run the backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be running at: http://localhost:8000
API docs at: http://localhost:8000/docs

## Step 2: Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
# Windows:
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
# Mac/Linux:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run the frontend server
npm run dev
```

Frontend will be running at: http://localhost:3000

## Step 3: Start Using the App

1. **Add Items to Stock**
   - Go to "Stock" page
   - Click "Add Item"
   - Enter item details (name, stock, prices, threshold)

2. **Record Your First Sale**
   - Go to "Record Sale" page
   - Enter item name, quantity, and price
   - Click "Record Sale"

3. **View Dashboard**
   - Check the dashboard for profit summaries and trends

4. **Try the AI Assistant**
   - Go to "AI Assistant" page
   - Ask questions like:
     - "What should I restock this week?"
     - "Which items sell the most?"
     - "How much profit did I make?"

## Troubleshooting

### Backend won't start
- Make sure Python 3.9+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify your virtual environment is activated

### Frontend won't start
- Make sure Node.js 18+ is installed
- Run `npm install` to install dependencies
- Check that `.env.local` file exists with `NEXT_PUBLIC_API_URL`

### AI Assistant not working
- Verify your OpenAI API key is set in backend `.env` file
- Check that you have credits in your OpenAI account
- The app will still work without AI, but with limited functionality

### Database issues
- The app uses SQLite by default (creates `shop.db` automatically)
- For production, update `DATABASE_URL` in `.env` to use PostgreSQL

## Next Steps

- Add more items to your inventory
- Record daily sales
- Monitor low stock alerts
- Use AI insights to optimize your business

Happy selling! 🛒
