import requests
import pickle
import yaml
import hashlib
import os
import datetime
from lxml import etree

def get_config():
    with open('data.yml', 'r', encoding='utf-8') as f:
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
        pickle.dump({'data':data,'time':time}, f)

def get_html(url):
    res = get_cache(url)
    if res is not None:
        return etree.HTML(res['data']),res['time']
    proxies = {
        'http': 'http://127.0.0.1:10809',
        'https': 'http://127.0.0.1:10809',
    }
    res = requests.get(url,proxies=proxies)
    d = f'{datetime.datetime.now()}'
    if res.status_code == 200:
        res.encoding = 'utf-8'
        html = etree.HTML(res.text)
        save_cache(url, res.text, d)
        return html,d
    else:
        return None,None

def get_titles(html, config):
    if config['title_xpath'] == '':
        return None
    title = html.xpath(config['title_xpath'])
    if len(title) > 0:
        return title
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
    base_url = data['base_url']
    origin_url = data['origin_url']
    note = data['note']
    d = data['time']
    with open('docs/'+filename+'.md', 'w', encoding='utf-8') as f:
        f.write(f'# {filetitle}\n\n')
        f.write(f'{len(titles)} papers accepted. Updated on **{d[:10]}**.\n\n{note}\n\nYou can find [the lastest information here]({origin_url}).\n\n---\n\n')
        for i in range(len(titles)):
            if links is not None:
                assert len(titles) == len(links)
                t = titles[i].strip().replace('`',"'").replace('\n','')
                if links[i].startswith('http'):
                    f.write(f'#### [{t}]({links[i].strip()})\n\n')
                else:
                    f.write(f'#### [{t}]({base_url}{links[i].strip()})\n\n')
            else:
                t = titles[i].strip().replace('`',"'").replace('\n','')
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

def guess_titles_from_links(links):
    titles = []
    for link in links:
        title = link.strip('/').split('/')[-1].replace('-', ' ')
        titles.append(title.title())
    return titles

def guess_links_from_titles(titles):
    links = []
    for title in titles:
        title = title.strip()
        for c in r'[@/!?#$%^&*()_+=`~–.,|:<>\\]':
            title = title.replace(c, '')
        link = title.lower().replace(' ', '-')
        while '--' in link:
            link = link.replace('--', '-')
        links.append(link)
    return links


def generate_readme(config):
    banner = """# A Collection of Security Papers on Top Publications

The following publications are included:

- IEEE S&P (oakland)
- USENIX Security Symposium (USENIX Sec)
- ACM CCS
- NDSS

PRs and issues are warmly welcomed.

To update, simply update `data.yml` and run `main.py` to crawl the latest information.

Here is a glance at all papers:

| Publication | Accepted Papers | Date | Link |
| :---: | :---: | :---: | :---: |
"""
    # traverse docs directory
    papers = []
    for file in os.listdir('docs'):
        if file.endswith('.md') and file != 'index.md':
            pub = ''
            for publication in config:
                if publication in file:
                   pub = publication
                   break 
            with open('docs/'+file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('#### ['):
                        title = line.split('](')[0][6:]
                        link = line.split('](')[1][:-2]
                        papers.append([pub, title.strip(), file[len(pub)+1:-3].strip(), f'[link]({link})'])
                    elif line.startswith('#### '):
                        title = line[5:]
                        papers.append([pub, title.strip(), file[len(pub)+1:-3].strip(), '-'])
    for paper in papers:
        banner += f'| {paper[0]} | {paper[1]} | {paper[2]} | {paper[3]} |\n'
    with open('README.md', 'w', encoding='utf-8') as f:
        f.write(banner)
    print('README.md generated')

if __name__ == '__main__':
    config = get_config()
    update_mkdocs_yml(config)
    if not os.path.exists('cache'):
        os.mkdir('cache')
    for top_site in config:
        for site in config[top_site]['sites']:
            html,time = get_html(site['url'])
            if html is not None:
                print(f'{config[top_site]["name"]}_{site["name"]} Success')
                titles = get_titles(html, site)
                links = get_links(html, site)
                note = ''
                if top_site == 'ndss':
                    if titles is None and links is not None:
                        # NDSS do not show the complete title
                        titles = guess_titles_from_links(links)
                    elif titles is not None and links is None:
                        # NDSS do not show the link
                        links = guess_links_from_titles(titles)
                data = {
                    'filetitle': f'{config[top_site]["name"]} {site["name"]}',
                    'filename': top_site+'_'+site['name'],
                    'titles': titles,
                    'links': links,
                    'base_url': site['base_url'],
                    'origin_url': site['url'],
                    'note': site.get('note', ''),
                    'time': time,
                }
                generate_md(data)
            else:
                print(f'Failed on {config[top_site]["name"]}_{site["name"]}')
    generate_readme(config)