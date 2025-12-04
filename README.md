# PoE2 Build Tracker

A web-based utility for Path of Exile 2 that allows users to create builds, track real-time item prices, and calculate total build costs.

## Features

- **Build Creator**: Create and save builds with specific item slots
- **Price Tracking**: Query the official PoE2 Trade API for current item prices
- **Price History**: Store and view historical price data
- **Build Cost Calculator**: Calculate total build cost at current market prices
- **Currency Converter**: Convert between different PoE2 currencies
- **Export/Import**: Export builds as JSON and import them

## Tech Stack

- **Backend**: Python (FastAPI)
- **Frontend**: Vanilla JavaScript
- **Database**: SQLite (PostgreSQL-ready)
- **HTTP Client**: httpx (async)

## Installation

### Prerequisites

- Python 3.10+
- pip

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd poe2-build-tracker
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database and seed data:
```bash
python -m backend.seed
```

5. Run the application:
```bash
python -m backend.main
```

The application will be available at `http://localhost:8000`.

## Configuration

Configuration is managed through environment variables or a `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `POE_LEAGUE` | `Rise of the Abyssal` | Current PoE2 league name |
| `DATABASE_URL` | `sqlite:///./poe2_tracker.db` | Database connection string |
| `DEBUG` | `True` | Enable debug mode |
| `USER_AGENT` | `PoE2BuildTracker/1.0` | User agent for API requests |
| `REQUEST_DELAY` | `2.0` | Seconds between API requests |
| `PRICE_CACHE_TTL` | `300` | Price cache TTL in seconds |

## API Endpoints

### Builds

- `GET /api/builds` - List all builds
- `POST /api/builds` - Create a new build
- `GET /api/builds/{id}` - Get a specific build
- `PUT /api/builds/{id}` - Update a build
- `DELETE /api/builds/{id}` - Delete a build
- `GET /api/builds/{id}/export` - Export build as JSON
- `POST /api/builds/import` - Import build from JSON

### Prices

- `POST /api/prices/lookup` - Look up price for a single item
- `POST /api/prices/bulk` - Look up prices for multiple items
- `GET /api/prices/build/{id}` - Get prices for all items in a build
- `GET /api/prices/history/{item_name}` - Get price history
- `GET /api/prices/change/{item_name}` - Get price change over time

### Currency

- `GET /api/prices/currency/rates` - Get current exchange rates
- `POST /api/prices/currency/convert` - Convert between currencies

### Trade API (Internal)

- `POST /api/trade/search` - Search for items
- `POST /api/trade/fetch` - Fetch item details
- `GET /api/trade/status` - Get rate limit status

## Project Structure

```
poe2-build-tracker/
├── backend/
│   ├── api/
│   │   ├── builds.py       # Build CRUD endpoints
│   │   ├── prices.py       # Price endpoints
│   │   └── trade.py        # GGG Trade API wrapper
│   ├── models/
│   │   ├── build.py        # Build/BuildItem models
│   │   └── price.py        # PriceSnapshot/CurrencyRate models
│   ├── services/
│   │   ├── currency.py     # Currency conversion
│   │   └── price_fetcher.py # Price fetching with caching
│   ├── config.py           # Configuration
│   ├── db.py               # Database setup
│   ├── main.py             # FastAPI application
│   └── seed.py             # Database seeding
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── data/
│   ├── unique_items.json   # Item autocomplete data
│   └── seed_builds.json    # Sample builds
├── requirements.txt
└── README.md
```

## Rate Limiting

The application respects the GGG Trade API rate limits:
- Parses `X-Rate-Limit-*` headers
- Implements exponential backoff on 429 responses
- Caches results to minimize API calls
- Default delay of 2 seconds between requests

## Sample Builds

The application comes with several pre-configured builds:

1. **Blackflame Purple Fire Blood Mage** - Chaos-converted fire DoT build
2. **Minion Army Necromancer** - Classic summoner build
3. **Elemental Hit Ranger** - Fast-clearing bow build
4. **Cyclone Slayer** - High sustain melee build

## Development

### Running in Development Mode

```bash
# With auto-reload
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests

```bash
pytest
```

## Notes

- League names change every ~3 months - update `POE_LEAGUE` accordingly
- Item names must match exactly (case-sensitive in API)
- Some items have variants (e.g., tribute items need specific variant specified)
- Prices are cached for 5 minutes by default

## Disclaimer

This project is not affiliated with or endorsed by Grinding Gear Games.

## License

MIT
