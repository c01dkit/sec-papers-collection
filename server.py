from datetime import datetime

from flask import Flask, request
import pymysql.cursors
import yaml
import sys
import os
import json
import requests
import random

app = Flask(__name__)

def query_llm(text):
    res = requests.post(
        url= _config['llm']['url'],
        headers={
            'Content-Type': 'application/json',
        },
        data=json.dumps({'query':text})
    )
    return res
def cors(resp):
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return resp

def print_progress(current, total):
    width = 20
    ok = width * current // total
    print('\r['+'='*ok+'>'+' '*(width-ok)+f'] {current}/{total}', end='')
def get_config(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        config = yaml.load(f, Loader=yaml.FullLoader)
        return config
def get_db():
    print('Start db connection!')
    return pymysql.connect(host=_config['db']['host'],
                           port=_config['db']['port'],
                           user=_config['db']['user'],
                           password=_config['db']['password'],
                           db='secvue',
                           cursorclass=pymysql.cursors.DictCursor)

def get_full_data():
    base_json = []
    for root, _, files in os.walk('./src/assets/data/meta_json'):
        for file in files:
            if file.endswith('.json'):
                update_json = json.load(open(os.path.join(root, file), 'r', encoding='utf-8'))
                for item in update_json:
                    base_json.append(item)
    return base_json
def update_db(_connection):
    """
        CREATE DATABASE `secvue`

        CREATE TABLE `meta` (
          `id` int NOT NULL AUTO_INCREMENT,
          `title` varchar(256) NOT NULL,
          `authors` varchar(512) NOT NULL,
          `abstract` text NOT NULL,
          `publication` varchar(32) NOT NULL,
          `year` int NOT NULL,
          `url` varchar(256) NOT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    """
    full_data = get_full_data()
    cursor = _connection.cursor()
    sql = """
INSERT INTO meta (id, title, authors, abstract, publication, year, url)
VALUES (%s, %s, %s, %s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
    title = %s,
    authors = %s,
    abstract = %s,
    publication = %s,
    year = %s,
    url = %s
"""
    total_records = len(full_data)
    cnt = 0
    for data in full_data:
        temp = {
            'id': data['id'],
            'title': data['title'],
            'authors': '#',
            'abstract': '#',
            'publication': data['publication'],
            'year': data['year'],
            'url': data['paper']
        }
        temp.update(data)
        values = (
            temp["id"], temp["title"], temp["authors"], temp["abstract"], temp["publication"], temp["year"], temp["paper"],
            temp["title"], temp["authors"], temp["abstract"], temp["publication"], temp["year"], temp["paper"]
        )
        try:
            cursor.execute(sql, values)
            cnt += 1
        except Exception as e:
            print(e)
            print(temp)
        _connection.commit()
        print_progress(cnt,total_records)


def extract_topic_with_llm(_outfilename):
    full_data = get_full_data()
    total_records = len(full_data)
    cnt = 0
    outfile = open(_outfilename, 'w', encoding='utf-8')
    prompt = """
Suppose you are a computer scientist. Here are some scientific topics:
Applied cryptography,
Attacks with novel insights, techniques, or results,
Authentication, access control, and authorization,
Blockchains and distributed ledger security,
Cloud computing security,
Cyber physical systems security,
Distributed systems security,
Economics of security and privacy,
Embedded systems security,
Formal methods and verification,
Hardware security,
Hate, Harassment, and Online Abuse,
Human-centered security and privacy,
Intrusion detection and prevention,
Machine learning and computer security,
Malware and unwanted software,
Network security and measurement,
Operating systems security,
Privacy-enhancing technologies, anonymity, and censorship,
Program and binary analysis,
Protocol security,
Security and privacy metrics,
Security and privacy policies,
Security architectures,
Security for at-risk populations,
Software supply chain security,
Systems security,
User studies for security and privacy,
Web security and privacy,
Wireless and mobile security/privacy.
Now I will show you an abstract of a computer paper. According to the abstract and the topics, tell me the keywords of the paper.
You show directly response me with simple phrases. Do not explain. You can also extract new keywords if the topics are not enough.
Here is the abstract: """
    for data in full_data:
        temp = {
            'id': data['id'],
            'title': data['title'],
            'authors': '#',
            'abstract': '#',
            'publication': data['publication'],
            'year': data['year'],
            'url': data['paper'],
        }
        temp.update(data)
        if temp['abstract'] != '#':
            _t = datetime.now()
            response = query_llm(prompt+temp['abstract'])
            temp['timecost'] = (datetime.now() - _t).total_seconds()
            temp.update(response.json())
            print(json.dumps(temp, ensure_ascii=False),file=outfile,flush=True)
        cnt += 1
        print_progress(cnt,total_records)
    outfile.close()

@app.route('/api/get-random')
def get_random_data():
    result = []
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM `meta` WHERE `abstract`<>'#' order by rand() limit 10;")
        while True:
            row = cursor.fetchone()
            if row is None:
                break
            result.append(row)
    return result
if __name__ == '__main__':
    _config = get_config('./config.yml')
    if '--llm-extract-topic' in sys.argv:
        extract_topic_with_llm('./official_cache/advanced_data/paper_topics.jl')
    if '--update-db' in sys.argv:
        connection = get_db()
        update_db(connection)
        connection.close()

    if '--start-server' in sys.argv:
        app.after_request(cors)
        connection = get_db()
        app.run(host='0.0.0.0', port=5555)#, ssl_context=(_config['ssl']['pubkey'], _config['ssl']['privkey']))