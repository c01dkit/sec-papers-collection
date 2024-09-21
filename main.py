
import requests
import pickle
import yaml
import hashlib
import os
import datetime
import json
import zipfile
from lxml import etree

def get_config(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        config = yaml.load(f, Loader=yaml.FullLoader)
        return config

def hash_url(url):
    hash = hashlib.sha256()
    hash.update(url.encode('utf-8'))
    return hash.hexdigest()

def get_cache(url):
    h = hash_url(url)
    try:
        with open('cache/'+h, 'rb') as f:
            return pickle.load(f)
    except FileNotFoundError:
        return None

def save_cache(url, data, time):
    h = hash_url(url)
    with open('cache/'+h, 'wb') as f:
        print(f'Save {url} in cache/{h}')
        pickle.dump({'data':data,'time':time}, f)

def get_html(url, use_cache=True):
    if type(url) is str:
        if use_cache:
            res = get_cache(url)
            if res is not None:
                return etree.HTML(res['data']),res['time']
        # proxies = {
        #     'http': 'http://10.59.159.54:10811',
        #     'https': 'http://10.59.159.54:10811',
        # }
        # res = requests.get(url,proxies=proxies)
        res = requests.get(url)
        d = f'{datetime.datetime.now()}'
        if res.status_code == 200:
            res.encoding = 'utf-8'
            html = etree.HTML(res.text)
            save_cache(url, res.text, d)
            return html,d
        else:
            print(f'Failed to get {url}')
            return None,None
    elif type(url) is list:
        htmls = []
        times = []
        for u in url:
            html,time = get_html(u, use_cache)
            htmls.append(html)
            times.append(time)
        return htmls,times

def get_titles(html, config):
    if config['title_xpath'] == '':
        return None
    title = html.xpath(config['title_xpath'])
    result = []
    for elem in title:
        result.append(elem.xpath('string(.)').strip())
    if len(result) > 0:
        return result
    else:
        return None

def get_links(html, config):
    if config['link_xpath'] == '':
        return None
    links = html.xpath(config['link_xpath'])
    if len(links) > 0:
        return links
    else:
        return None

def fetch_one_paper_in_config(config):
    """
    This function will fetch (online or in cache) and return one paper info.
    This function is used as an iterator, yielding all papers from top to bottom in the config.
    :param config:
    :return:
    """
    paper_id = 0
    for publication in config:
        publication_config = config[publication]
        for one_site_config in publication_config['sites']:
            # first priority: use json file as details
            official_file = one_site_config.get('official_file',None)
            if official_file is not None:
                json_details = official_file[:official_file.index('.')] + '.json'
                print(f'Use official data for {publication} {one_site_config['year']}')
                with open(os.path.join('official_cache',json_details), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for paper_detail in data:
                        paper_id += 1
                        one_paper_info = {
                            'id': paper_id,
                            'year': one_site_config['year'],
                            'title': paper_detail['title'],
                            'publication': paper_detail['publication'],
                            'paper': paper_detail['paper'],
                        }
                        yield one_paper_info
            else:
                # second priority: crawl website if json file does not exist
                use_cache = one_site_config.get('use_cache', True)
                html, time = get_html(one_site_config['url'], use_cache)
                print(f'Use crawled data for {publication} {one_site_config["year"]}')
                if html is not None:
                    if type(html) is list:
                        titles = []
                        links = []
                        for h in html:
                            titles += get_titles(h, one_site_config)
                            links += get_links(h, one_site_config)
                        if links is not None:
                            assert(len(links)==len(titles))
                    else:
                        titles = get_titles(html, one_site_config)
                        links = get_links(html, one_site_config)
                        if links is not None:
                            assert(len(links)==len(titles))
                    for i in range(len(titles)):
                        t = titles[i].strip().replace('\n','')
                        paper_id += 1
                        one_paper_info = {
                            'id': paper_id,
                            'year': one_site_config['year'],
                            'title': t,
                            'publication': config[publication]['name'],
                            'paper': '#' if links is None else links[i], # The url of the paper. If not found, return '#' by default.
                        }
                        yield one_paper_info

def export_data_json(project_base, public_base):
    config = get_config('data.yml')
    json_all = []
    quick_view = []
    statistics = {'total':0,'overview':[],'byPublication':{},'byYear':{}}
    color_set = ['--p-emerald-400','--p-lime-400','--p-red-400',
                 '--p-amber-400','--p-teal-400','--p-blue-400',
                 '--p-purple-400','--p-zinc-400']
    publication_growth = {}
    for one_paper_info in fetch_one_paper_in_config(config):
        publication = one_paper_info['publication']
        year = str(one_paper_info['year'])

        # Full paper info
        json_all.append(one_paper_info)

        # Statistics
        statistics['total'] += 1
        statistics['byPublication'].setdefault(publication,0)
        statistics['byPublication'][publication] += 1
        statistics['byYear'].setdefault(year,0)
        statistics['byYear'][year] += 1

        # Quick view: generate a small version of full paper info (100 latest paper from each publication)
        if statistics['byPublication'][publication] <= 100:
            quick_view.append(one_paper_info)

        # Overview
        publication_growth.setdefault(publication,{})
        publication_growth[publication].setdefault(year,0)
        publication_growth[publication][year] += 1

    for publication, growth in publication_growth.items():
        statistics['overview'].append({
            'label': publication,
            'data': [i for i in dict(sorted(growth.items(), key=lambda x: x[0])).values()],
            'fill': False,
            'borderColor': color_set.pop(),
            'tension': 0.4,
        })
    statistics['byYear'] = dict(sorted(statistics['byYear'].items(), key=lambda x: int(x[0])))
    statistics['years'] = list(statistics['byYear'].keys())

    for json_name, json_file in {
        'data-statistics.json': statistics,
        'data-quick-view.json': quick_view,
        'data.json': json_all,
    }.items():
        json.dump(json_file, open(os.path.join(project_base + json_name), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)


def generate_zip_cache():
    cache_dir = './cache'
    with zipfile.ZipFile('cache.zip', "w", zipfile.ZIP_DEFLATED) as zpf:
        for path, _, filenames in os.walk(cache_dir):
            for filename in filenames:
                zpf.write(os.path.join(path, filename), os.path.join(path, filename))

def prepare_official_data():
    """Parse csv files for official data. Crawling website is not the best practice."""

    def parse_xplore_csv(csv_file_name:str, __publication:str):
        from analyzers.xplore_analyzer import XPLORE
        xplore = XPLORE(__publication)
        json_file_name = csv_file_name.replace('.csv', '.json')
        check = xplore.analyze_csv(os.path.join('official_cache',csv_file_name))
        if check:
            with open(os.path.join('official_cache',json_file_name), 'w', encoding='utf8') as f:
                json.dump(xplore.dump(),f,ensure_ascii=False)
            return len(xplore.result)
        return 0

    def parse_acm_bib(bib_file_name:str, __publication:str):
        from analyzers.acmbib_analyzer import ACMBIB
        acmbib = ACMBIB(__publication)
        json_file_name = bib_file_name.replace('.bib', '.json')
        check = acmbib.analyze_bib(os.path.join('official_cache',bib_file_name))
        if check:
            with open(os.path.join('official_cache',json_file_name), 'w', encoding='utf8') as f:
                json.dump(acmbib.dump(),f,ensure_ascii=False)
            return len(acmbib.result)
        return 0

    config = get_config('data.yml')
    for publication in config:
        publication_config = config[publication]
        for one_site_config in publication_config['sites']:
            official_file = one_site_config.get('official_file',None)
            if official_file is None: continue
            json_file = official_file[:official_file.index('.')] + '.json'
            if not os.path.exists(os.path.join('official_cache',json_file)):
                if publication in ['oakland','icse']:
                    paper_num = parse_xplore_csv(official_file, publication_config['name'])
                elif publication in ['ccs','issta']:
                    paper_num = parse_acm_bib(official_file, publication_config['name'])
                else:
                    paper_num = 0
                print(f"Generating official data for {publication} {one_site_config['year']} : {paper_num} papers")

if __name__ == '__main__':
    if os.path.exists('official_cache'):
        prepare_official_data()
    export_data_json('src/assets/data/', 'public/data/')
    generate_zip_cache()
    print('All done.')
