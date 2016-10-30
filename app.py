from flask import Flask, render_template, jsonify, request
import sqlite3
import numpy as np
import pandas as pd
import urllib
import json
import re
import threading as th
import sklearn.ensemble as ske
from sklearn.externals import joblib
from datetime import timedelta, datetime

app = Flask(__name__)
DATABASE = 'food.db'
STOPWORDS = ['all', 'just', 'being', 'over', 'both', 'through', 'yourselves', 'its', 'before', 'with', 'had', 'should', 'to', 'only', 'under', 'ours', 'has', 'do', 'them', 'his', 'very', 'they', 'not', 'during', 'now', 'him', 'nor', 'did', 'these', 't', 'each', 'where', 'because', 'doing', 'theirs', 'some', 'are', 'our', 'ourselves', 'out', 'what', 'for', 'below', 'does', 'above', 'between', 'she', 'be', 'we', 'after', 'here', 'hers', 'by', 'on', 'about', 'of', 'against', 's', 'or', 'own', 'into', 'yourself', 'down', 'your', 'from', 'her', 'whom', 'there', 'been', 'few', 'too', 'themselves', 'was', 'until', 'more', 'himself', 'that', 'but', 'off', 'herself', 'than', 'those', 'he', 'me', 'myself', 'this', 'up', 'will', 'while', 'can', 'were', 'my', 'and', 'then', 'is', 'in', 'am', 'it', 'an', 'as', 'itself', 'at', 'have', 'further', 'their', 'if', 'again', 'no', 'when', 'same', 'any', 'how', 'other', 'which', 'yo', 'who', 'most', 'such', 'why', 'a', 'don', 'i', 'having', 'so', 'the', 'yours', 'once']
models = {}
model_features = {}
file_lock = th.Lock()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/rate', methods=['POST'])
def rate():
    data = request.form
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    
    user = "" if len(data.getlist('user')) <= 0 else data.getlist('user')[0]
    title_fi = "" if len(data.getlist('course[title_fi]')) <= 0 else data.getlist('course[title_fi]')[0]
    title_en = "" if len(data.getlist('course[title_en]')) <= 0 else data.getlist('course[title_en]')[0]
    category = "" if len(data.getlist('course[category]')) <= 0 else data.getlist('course[category]')[0]
    properties = "" if len(data.getlist('course[properties]')) <= 0 else data.getlist('course[properties]')[0]
    score = 0 if len(data.getlist('score')) <= 0 else data.getlist('score')[0]
    
    cur.execute("INSERT INTO ratings VALUES (?, ?, ?, ?, ?, ?, ?)", 
                         (str(datetime.utcnow()), 
                          user, 
                          title_fi,
                          title_en,
                          category, 
                          properties, 
                          score))
    conn.commit()
    conn.close()
    
    return jsonify(True)

@app.route('/get_ratings', methods=['POST'])
def get_ratings():
    data = request.form
    
    user = "" if len(data.getlist('user')) <= 0 else data.getlist('user')[0]
    title_en = "" if len(data.getlist('course[title_en]')) <= 0 else data.getlist('course[title_en]')[0]
    category = "" if len(data.getlist('course[category]')) <= 0 else data.getlist('course[category]')[0]
    props = "" if len(data.getlist('course[properties]')) <= 0 else data.getlist('course[properties]')[0]
    
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    
    table = cur.execute("SELECT rating FROM ratings WHERE user=? AND title_en=? AND title_en != '' ORDER BY date DESC", (user, title_en)).fetchone()
    rating = 0 if table is None else table[0]
    
    conn.close()
    
    return jsonify({
                    "rating": rating,
                    "prediction": get_predicted_rating({'user': user, 'title_en': title_en, 'category': category, 'properties': props})
                    })
    

def get_predicted_rating(data):
    #Primarily use in-memory model trained for user
    if(data['user'] in models and data['user'] in model_features):
        model = models[data['user']]
        features = model_features[data['user']]
    else:
        try:
            model = joblib.load('models/' + data['user'] + '.pkl')
            features = joblib.load('features/' + data['user'] + '.pkl')
        except:
            if('' in models and '' in model_features):
                model = models['']
                features = model_features['']
            else:
                model = joblib.load('models/' + '.pkl')
                features = joblib.load('features/' + '.pkl')
            print 'Using default model and features for {}'.format(data['user'])
        
    X = get_feature_vector(data, features)
    y = model.predict(X)[0]
    
    y = 1 if y < 1 else y
    y = 5 if y > 5 else y
    
    return y;
    
@app.route('/get_data/<date>', methods=['GET'])
def get_data(date):
    date_parsed = datetime.strptime(date, '%Y-%m-%d')
    start = date_parsed - timedelta(days=date_parsed.weekday())
    
    print start
    
    week_menu = {}
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    
    i = 0
    
    for wd in weekdays:
        date = start + timedelta(days=i)
        url = "http://www.sodexo.fi/ruokalistat/output/daily_json/17196/{}/{}/{}/fi".format(date.year, date.month, date.day)
        response = str(urllib.urlopen(url).read())
        data = json.loads(response, strict=False)
        week_menu[wd] = data
        i += 1
        
    return jsonify(week_menu)

@app.route('/train', methods=['GET'])
def train_models():
    users = fetch_users()
    
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
        
    for user in users:
        table = cur.execute("SELECT date, user, title_en, category, properties, rating FROM ratings").fetchall()
        
        data = np.array(table, dtype=[('date', 'str', 150), ('user', 'str', 150), ('title_en', 'str', 150), ('category', 'str', 20), ('properties', 'str', 10), ('rating', np.int16)])
        X = extract_features(data)
        y = extract_labels(data)
        reg = ske.GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=0, loss='ls')
        reg.fit(X.values, y.values)
        
        models[user] = reg
        model_features[user] = X.columns
        
        file_lock.acquire()
        try:
            joblib.dump(reg, 'models/' + user + '.pkl')
            joblib.dump(X.columns, 'features/' + user + '.pkl')
            
        except:
            print 'Could not serialize model or features for ' + user
        file_lock.release()
        
    conn.close()
    
    return jsonify({ "features": str(X.columns), "model": str(reg) })
    
def extract_features(data):
    # Form OHE features for titles
    
    # Preprocess titles
    titles = [remove_punctuation(title) for title in np.char.strip(data['title_en'])]
    
    word_dict = {}
    
    for title in titles:
        for word in title.split():
            if word in STOPWORDS:
                continue
            
            if word not in word_dict:
                word_dict[word] = 1
            else:
                word_dict[word] = word_dict[word] + 1
    
    # Build token features from titles
    features_np = np.zeros(np.size(data['title_en']), 
                        dtype=[('token_' + key, np.int8) for key in word_dict.keys()])
    
    features = pd.DataFrame(features_np)
    
    #Build user features
    users = fetch_users()
    features_np = np.zeros(np.size(data['title_en']), dtype=[('user_' + str(key), np.int8) for key in users])
    features = pd.concat([features, pd.DataFrame(features_np)], axis=1)
    
    # Add other features from data
    features_np = np.zeros(np.size(data['title_en']), 
                                   dtype=[('category_local', np.int8), 
                                          ('category_global', np.int8), 
                                          ('category_sweet', np.int8),
                                          ('category_veggie', np.int8),
                                          ('category_grill', np.int8),
                                          ('property_l', np.int8), 
                                          ('property_g', np.int8), 
                                          ('property_m', np.int8)])
    
    features = pd.concat([features, pd.DataFrame(features_np)], axis=1)
    
    i = 0
    for row in data:
        tokens = extract_tokens(row['title_en'])
        
        for feature in features.columns:
            if(feature in tokens):
                features[feature][i] = 1
                
        #Add category (Local, Global, Sweet) info
        if row['category'].lower() == 'local':
            features['category_local'][i] = 1
        if row['category'].lower() == 'global':
            features['category_global'][i] = 1
        if row['category'].lower() == 'sweet':
            features['category_sweet'][i] = 1
        
        #Add property (L,G,M) info
        props = extract_properties(row['properties'])
        
        for prop in props:
            if prop == 'l':
                features['property_l'][i] = 1
            if prop == 'g':
                features['property_g'][i] = 1
            if prop == 'm':
                features['property_m'][i] = 1
        
        i += 1
                
    
    return features

def get_feature_vector(data, features):
    
    X = pd.DataFrame(np.zeros((1, np.size(features))), columns=features)
    
    tokens = extract_tokens(data['title_en'])
    
    for feature in features:
        if(feature in tokens):
            X[feature] = 1
    
    # Add user info
    user = data['user']
    if 'user_' + user in features:
        X['user_' + user] = 1
    
    #Add category (Local, Global, Sweet) info
    if data['category'].lower() == 'local':
        X['category_local'] = 1
    if data['category'].lower() == 'global':
        X['category_global'] = 1
    if data['category'].lower() == 'sweet':
        X['category_sweet'] = 1
    
    #Add property (L,G,M) info
    props = extract_properties(data['properties'])
    
    for prop in props:
        if prop == 'l':
            X['property_l'] = 1
        if prop == 'g':
            X['property_g'] = 1
        if prop == 'm':
            X['property_m'] = 1
    
    return X

def extract_properties(prop_text):
    return [prop.strip().lower() for prop in prop_text.split(',')]
    
def extract_tokens(row):
    return ['token_' + remove_punctuation(token) for token in row.strip().split()]

def extract_labels(data):
    return pd.DataFrame(np.array(data['rating'], dtype=np.int8))
    
def remove_punctuation(title):
    """Removes punctuation, changes to lower case, and strips leading and trailing spaces."""
    """Replace theses with spaces due to common spelling mistakes..."""
    
    return re.sub('[^A-Za-z0-9\s]+', lambda x: ' ', title).lower().rstrip().lstrip()

@app.route('/get_users', methods=['GET'])
def get_users():
    users = fetch_users()
    users.remove((''))
    
    return jsonify(users)
    
def fetch_users():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    usr = cur.execute("SELECT DISTINCT user FROM ratings").fetchall()
    conn.close()
    
    return map(lambda x: x[0], usr)

def init_db():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    table = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ratings'").fetchone()
    
    if(table is None):
        cur.execute('''CREATE TABLE ratings
             (date text, user text, title_fi text, title_en text, category text, properties text, rating int)''')
        
        cur.execute('''CREATE INDEX ind_user ON ratings (user)''')
        
        cur.execute('''CREATE INDEX ind_user_title_en ON ratings (user, title_en)''')
        
    conn.commit()
    conn.close()
    
if __name__ == '__main__':
    init_db()
    app.run(debug=True)

    