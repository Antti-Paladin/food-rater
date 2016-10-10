from flask import Flask, render_template, jsonify, request
import sqlite3
import sklearn.linear_model as skl
import urllib, json

from datetime import date, datetime

app = Flask(__name__)
DATABASE = 'food.db'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/hello')
def hello():
    return render_template('hello.html')

@app.route('/rate', methods=['POST'])
def rate():
    data = request.form
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    
    user = "None" if len(data.getlist('user')) <= 0 else data.getlist('user')[0]
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

@app.route('/get_data/<date>', methods=['GET'])
def get_data(date):
    date_parsed = datetime.strptime(date, '%Y-%m-%d')
    url = "http://www.sodexo.fi/ruokalistat/output/daily_json/17196/{}/{}/{}/fi".format(date_parsed.year, date_parsed.month, date_parsed.day)
    response = urllib.urlopen(url)
    data = json.loads(response.read())
    return jsonify(data)
    
def init_db():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    table = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ratings'").fetchone()
    
    if(table is None):
        cur.execute('''CREATE TABLE ratings
             (date text, user text, title_fi text, title_en text, category text, properties text, rating int)''')
    conn.commit()
    conn.close()
    
if __name__ == '__main__':
    init_db()
    app.run(debug=True)

    