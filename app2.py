from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from exa_py import Exa
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import requests
from googleapiclient.discovery import build
import io
import csv
import json

app = Flask(__name__)
CORS(app)

EXA_API_KEY = 'YOUR_EXA_API_KEY'
GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'
GOOGLE_CX = 'YOUR_GOOGLE_CX'
YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY'

# In-memory trending and favorites (for demo; use DB for production)
trending = {}
favorites = []
clicks = {}

def search_exa(query, num_results=5):
    exa = Exa(EXA_API_KEY)
    response = exa.search(query, num_results=num_results)
    results = []
    for r in response.results:
        snippet = getattr(r, 'text', None) or getattr(r, 'snippet', None) or ''
        results.append({
            'source': 'Exa',
            'title': r.title,
            'url': r.url,
            'snippet': snippet
        })
    return results

def search_google(query, num_results=5):
    url = 'https://www.googleapis.com/customsearch/v1'
    params = {
        'key': GOOGLE_API_KEY,
        'cx': GOOGLE_CX,
        'q': query,
        'num': num_results
    }
    resp = requests.get(url, params=params)
    data = resp.json()
    results = []
    for item in data.get('items', []):
        results.append({
            'source': 'Google',
            'title': item.get('title'),
            'url': item.get('link'),
            'snippet': item.get('snippet', '')
        })
    return results

def search_youtube(query, max_results=5):
    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
    request = youtube.search().list(
        q=query,
        part="snippet",
        type="video",
        maxResults=max_results
    )
    response = request.execute()
    results = []
    for item in response.get("items", []):
        video_id = item["id"]["videoId"]
        title = item["snippet"]["title"]
        url = f"https://www.youtube.com/watch?v={video_id}"
        snippet = item["snippet"]["description"]
        results.append({
            "source": "YouTube",
            "title": title,
            "url": url,
            "snippet": snippet
        })
    return results

def get_recommendations(query):
    # Simple keyword-based recommendations (expand as needed)
    keywords = query.lower().split()
    recs = []
    for k in trending:
        if any(word in k for word in keywords) and k != query:
            recs.append(k)
    return recs[:5]

def rank_results_by_tfidf(query, all_results):
    # Flatten all results into a list of dicts
    flat_results = []
    for source, items in all_results.items():
        for r in items:
            flat_results.append({**r, 'source': source})

    # Prepare documents: combine title + snippet for each result
    docs = [f"{r['title']} {r['snippet']}" for r in flat_results]
    # Add the query as the first document
    docs = [query] + docs

    # Compute TF-IDF matrix
    vectorizer = TfidfVectorizer().fit(docs)
    tfidf_matrix = vectorizer.transform(docs)

    # Compute cosine similarity between query and each result
    query_vec = tfidf_matrix[0]
    doc_vecs = tfidf_matrix[1:]
    scores = np.dot(doc_vecs, query_vec.T).toarray().flatten()

    # Attach scores and sort
    for i, r in enumerate(flat_results):
        r['score'] = scores[i]
    ranked = sorted(flat_results, key=lambda x: x['score'], reverse=True)
    return ranked

@app.route('/api/search', methods=['POST'])
def api_search():
    data = request.json
    query = data.get('query', '')
    num_results = int(data.get('num_results', 5))
    trending[query] = trending.get(query, 0) + 1

    exa = search_exa(query, num_results)
    google = search_google(query, num_results)
    youtube = search_youtube(query, num_results)
    all_results = {'Exa': exa, 'Google': google, 'YouTube': youtube}

    # Rank all results together
    ranked_results = rank_results_by_tfidf(query, all_results)

    recommendations = get_recommendations(query)
    return jsonify({
        'results': {
            'Ranked': ranked_results,  # send as a single ranked list
            'Exa': exa,
            'Google': google,
            'YouTube': youtube
        },
        'recommendations': recommendations,
        'trending': sorted(trending, key=trending.get, reverse=True)[:5]
    })

@app.route('/api/export', methods=['POST'])
def api_export():
    data = request.json
    results = data.get('results', {})
    fmt = data.get('format', 'csv')
    if fmt == 'csv':
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['Source', 'Title', 'URL', 'Snippet'])
        for source, items in results.items():
            for r in items:
                cw.writerow([source, r['title'], r['url'], r['snippet']])
        output = io.BytesIO()
        output.write(si.getvalue().encode('utf-8'))
        output.seek(0)
        return send_file(output, mimetype='text/csv', as_attachment=True, download_name='results.csv')
    elif fmt == 'json':
        output = io.BytesIO()
        output.write(json.dumps(results).encode('utf-8'))
        output.seek(0)
        return send_file(output, mimetype='application/json', as_attachment=True, download_name='results.json')
    else:
        return "Invalid format", 400

@app.route('/api/favorites', methods=['GET', 'POST'])
def api_favorites():
    global favorites
    if request.method == 'POST':
        fav = request.json.get('favorite')
        if fav and fav not in favorites:
            favorites.append(fav)
        return jsonify({'status': 'ok'})
    else:
        return jsonify({'favorites': favorites})

@app.route('/api/click', methods=['POST'])
def api_click():
    data = request.json
    url = data.get('url')
    if url:
        clicks[url] = clicks.get(url, 0) + 1
    return jsonify({'status': 'ok'})

@app.route('/api/analytics', methods=['GET'])
def api_analytics():
    trending_list = sorted(trending.items(), key=lambda x: x[1], reverse=True)
    most_clicked = sorted(clicks.items(), key=lambda x: x[1], reverse=True)
    return jsonify({
        'trending': trending_list,
        'most_clicked': most_clicked
    })

if __name__ == '__main__':
    app.run(debug=True)
