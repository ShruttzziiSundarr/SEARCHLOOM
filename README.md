# SEARCHLOOM
ALL MULTIPLE SEARCH COMBINED INTO ONE SINGLE THING
# Smart Unified Search Engine

A modern, visually stunning unified search engine that aggregates results from Exa, Google Custom Search, and YouTube Data API. Features intelligent ranking, analytics dashboard, export, favorites, and more—all with a beautiful Bootstrap React frontend and a Python Flask backend.

## Features
- **Aggregated Search:** Results from Exa, Google, and YouTube in one place
- **Intelligent Ranking:** Results ranked by relevance using TF-IDF
- **Trends & Analytics Dashboard:** Visualize trending searches and most-clicked results
- **Export:** Download results as CSV or JSON
- **Favorites:** Save favorite results for later
- **Copy Link:** One-click copy for any result
- **Recommendations:** Related queries based on search history
- **Modern UI:** Responsive, animated, and user-friendly (Bootstrap + React)

## Tech Stack
- **Backend:** Python, Flask, flask-cors, scikit-learn, exa-py, google-api-python-client
- **Frontend:** React, Bootstrap, Axios, Chart.js (react-chartjs-2), React Toastify

## Setup Instructions

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd <project-folder>
```

### 2. Backend Setup
- Go to the backend directory (where `app2.py` is located).
- Install dependencies:
  ```sh
  pip install flask flask-cors exa-py requests google-api-python-client scikit-learn numpy
  ```
- **API Keys:**
  - Get your Exa, Google Custom Search, and YouTube Data API keys.
  - Edit `app2.py` and set:
    ```python
    EXA_API_KEY = 'YOUR_EXA_API_KEY'
    GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'
    GOOGLE_CX = 'YOUR_GOOGLE_CX'
    YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY'
    ```
- Start the backend:
  ```sh
  python app2.py
  ```
  The backend runs on [http://127.0.0.1:5000](http://127.0.0.1:5000)

### 3. Frontend Setup
- Go to the `frontend` directory.
- Install dependencies:
  ```sh
  npm install
  npm install bootstrap axios react-toastify chart.js react-chartjs-2 react-icons
  ```
- Start the frontend:
  ```sh
  npm start
  ```
  The frontend runs on [http://localhost:3000](http://localhost:3000)

## Usage
- Enter a search query and view ranked results from all sources.
- Use the Analytics Dashboard to see trending searches and most-clicked results.
- Export results as CSV/JSON, copy links, and save favorites.
- All features are accessible from the web UI.

## Main Functionalities
- **Unified Search:** Aggregates and deduplicates results from multiple APIs.
- **TF-IDF Ranking:** Most relevant results shown first.
- **Analytics Dashboard:** Visualizes search and click trends.
- **Export & Favorites:** Download or save results for later.
- **Responsive UI:** Works on desktop and mobile.

## Contribution
1. Fork the repo and create your branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a pull request

## License
MIT 
