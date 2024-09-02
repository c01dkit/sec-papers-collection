
import requests
import pickle
import yaml
import hashlib
import os
import datetime
import re
import sys
import json
# import matplotlib.pyplot as plt
# import seaborn as sns
# import pandas as pd
from pathlib import Path
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

def generate_md(data):
    filetitle = data['filetitle']
    filename = data['filename']
    titles = data['titles']
    links = data['links']
    origin_url = data['origin_url']
    note = data['note']
    d = data['time']
    with open('docs/'+filename+'.md', 'w', encoding='utf-8') as f:
        f.write('---\n')
        f.write(f'title: {filetitle}\n')
        f.write('---\n\n')
        f.write(f'# {filetitle}\n\n')
        f.write(f'{len(set(titles))} papers accepted.\n\n')
        if type(origin_url) is list:
            for i in range(len(origin_url)):
                f.write(f'Updated on **{d[i][:10]}**.\n\n{note}\n\nYou can find [the lastest information here]({origin_url[i]}).\n\n')
        else:
            f.write(f'Updated on **{d[:10]}**.\n\n{note}\n\nYou can find [the lastest information here]({origin_url}).\n\n')
        f.write('---\n\n')
        for i in range(len(titles)):
            t = titles[i].strip().replace('`',"'").replace('\n','')
            if links is not None:
                assert len(titles) == len(links)
                f.write(f'#### [{t}]({links[i].strip()})\n\n')
            else:
                f.write(f'#### {t}\n\n')

def update_mkdocs_yml(config):
    with open('mkdocs.yml', 'r', encoding='utf-8') as f:
        mkdocs = yaml.load(f, Loader=yaml.FullLoader)
    new_nav = [{'All':'index.md'}]
    for top_site in config:
        new_site = {config[top_site]['name']: []}
        for site in config[top_site]['sites']:
            new_site[config[top_site]['name']].append({site['name']: top_site+'_'+site['name']+'.md'})
        new_nav.append(new_site)
    mkdocs['nav'] = new_nav
    with open('mkdocs.yml', 'w', encoding='utf-8') as f:
        yaml.dump(mkdocs, f)

def get_statistics(config):
    # traverse docs directory
    statistics = []
    re_paper_num = re.compile(r'(\d+) papers accepted')
    re_paper_url = re.compile(r'\[the lastest information here\]\((.+)\)')
    for top_site in config:
        for site in config[top_site]['sites']:
            md_file = Path('docs/'+top_site+'_'+site['name']+'.md')
            if md_file.exists():
                with open(md_file, 'r', encoding='utf-8') as f:
                    md = f.read()
                    paper_num = re_paper_num.findall(md)[0]
                    paper_url = re_paper_url.findall(md)
                    link_url = ''
                    for url in paper_url:
                        link_url += f'[link]({url}) '
                    statistics.append((config[top_site]['name'],site['name'], paper_num,  link_url))
    return statistics

def generate_readme(config, statistics=None, graphs=''):
    banner = """# A Collection of Security Papers on Top-Tier Conferences


**These papers are sorted by conference and date, and are deployed via github pages. Please [click here to visit the website](https://sec.c01dkit.com).**

The following publications are included:

- IEEE S&P (Oakland)
- USENIX Security Symposium (USENIX Sec)
- ACM CCS
- NDSS

Since some topics on software testing are related to security, the following publications are also included:

- ICSE
- ISSTA

<<GRAPHS>>

**PRs and issues are warmly welcomed.**

To update, simply update `data.yml` and run `main.py` to crawl the latest information, then `mkdocs gh-deploy --clean` to deploy the website.

Here is a glance at all papers/posters:

| Publication | Date | Accepted Paper Number | Link |
| :---: | :---: | :---: | :---: |
"""
    if statistics is None:
        statistics = get_statistics(config)
    for paper in statistics:
        banner += f'| {paper[0]} | {paper[1]} | {paper[2]} | {paper[3]} |\n'
    with open('README.md', 'w', encoding='utf-8') as f:
        if graphs == '':
            banner = banner.replace('<<GRAPHS>>', graphs)
        else:
            banner = banner.replace('<<GRAPHS>>', '\n'.join(['!['+i.replace('./img/','').replace('.png','')+f']({i})' for i in graphs]))
        f.write(banner)

    print('README.md generated')

def export_data_json():
    config = get_config('data.yml')
    json_all = []
    statis = {'total':0,'overview':[]}
    paper_id = 0
    color_set = ['--p-emerald-400','--p-lime-400','--p-red-400',
                 '--p-amber-400','--p-teal-400','--p-blue-400',
                 '--p-purple-400','--p-zinc-400']
    for top_site in config:
        statis.setdefault(config[top_site]['name'],0)
        data_publication_year = {} # year -> pubnum
        for site in config[top_site]['sites']:
            use_cache = site.get('use_cache', True)
            html,time = get_html(site['url'],use_cache)
            statis.setdefault(site['name'],0)
            if html is not None:
                if type(html) is list:
                    titles = []
                    links = []
                    for h in html:
                        titles += get_titles(h, site)
                        links += get_links(h, site)
                    if links is not None:
                        assert(len(links)==len(titles))
                else:
                    titles = get_titles(html, site)
                    links = get_links(html, site)
                    if links is not None:
                        assert(len(links)==len(titles))
                data = {
                    'filetitle': f'{config[top_site]["name"]} {site["name"]}',
                    'filename': top_site+'_'+site['name'],
                    'titles': titles,
                    'links': links,
                    'origin_url': site['url'],
                    'note': site.get('note', ''),
                    'time': time,
                }
                for i in range(len(titles)):
                    t = titles[i].strip().replace('`',"'").replace('\n','')
                    temp = {
                        'id': paper_id,
                        'year': site['year'],
                        'title': t,
                        'publication': config[top_site]['name'],
                        'paper': '#',
                    }
                    data_publication_year.setdefault(str(site['year']),0)
                    data_publication_year[str(site['year'])] += 1
                    if links is not None:
                        assert len(titles) == len(links)
                        temp['paper'] = links[i].strip().replace('`',"'").replace('\n','')
                    json_all.append(temp)
                    paper_id += 1
                    statis[config[top_site]['name']] += 1
                    statis[site['name']] += 1
                    statis['total'] += 1
            else:
                print(f'Failed on {config[top_site]["name"]}_{site["name"]}')
        # sort data publication year with keys
        data_publication_year = dict(sorted(data_publication_year.items(), key=lambda x: int(x[0])))
        statis['overview'].append({
            'label': config[top_site]['name'],
            'data': list(data_publication_year.values()),
            'fill': False,
            'borderColor': color_set.pop(),
            'tension':0.4
        })
        statis.setdefault('years',list(data_publication_year.keys()))
    json.dump(json_all, open('src/assets/data/data.json', 'w', encoding='utf8'), indent=2, ensure_ascii=False)
    json.dump(statis, open('src/assets/data/data-statis.json', 'w', encoding='utf8'), indent=2, ensure_ascii=False)

if __name__ == '__main__':
    if '--json' in sys.argv:
        export_data_json()
        print('All done.')
        exit()
    config = get_config('data.yml')
    update_mkdocs_yml(config)
    if not os.path.exists('cache'):
        os.mkdir('cache')
    for top_site in config:
        for site in config[top_site]['sites']:
            use_cache = site.get('use_cache', True)
            html,time = get_html(site['url'],use_cache)
            if html is not None:
                if type(html) is list:
                    titles = []
                    links = []
                    for h in html:
                        titles += get_titles(h, site)
                        links += get_links(h, site)
                    if links is not None:
                        assert(len(links)==len(titles))
                else:
                    titles = get_titles(html, site)
                    links = get_links(html, site)
                    if links is not None:
                        assert(len(links)==len(titles))
                note = ''
                data = {
                    'filetitle': f'{config[top_site]["name"]} {site["name"]}',
                    'filename': top_site+'_'+site['name'],
                    'titles': titles,
                    'links': links,
                    'origin_url': site['url'],
                    'note': site.get('note', ''),
                    'time': time,
                }
                generate_md(data)
                print(f'{config[top_site]["name"]}_{site["name"]} Success.')
            else:
                print(f'Failed on {config[top_site]["name"]}_{site["name"]}')
    statistics = get_statistics(config)
    # generate_readme(config, statistics)
    print('All done.')