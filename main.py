import requests
import pickle
import yaml
import hashlib
import os
import datetime
import json
import analyzers.zip_manager as zip_manager
import argparse
from dotenv import load_dotenv
from dataclasses import dataclass, field, asdict
from lxml import etree

load_dotenv()

@dataclass
class AcceptanceTrend:
    category: str = '#'
    label: str = '#'
    # data: list = field(default_factory=list)
    map_data: dict = field(default_factory=dict)
    fill: bool = False
    borderColor: str = '--p-emerald-400'
    tension: float = 0.4

@dataclass
class Statistics:
    total: int = 0
    overview: list = field(default_factory=list)
    byPublication: dict = field(default_factory=dict)
    byYear: dict = field(default_factory=dict)
    byPublicationAndYear: dict = field(default_factory=dict)
    byPublicationAndYearAndStatus: dict = field(default_factory=dict)
    years: list = field(default_factory=list)

@dataclass
class PaperInfo:
    id: int = -1
    year: int = -1
    title: str = '#'
    category: str = '#'
    publication: str = '#'
    paper: str = '#'
    abstract: str = '#'
    status: str = 'notchecked'

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
    if type(url) is list:
        htmls = []
        times = []
        for u in url:
            html,time = get_html(u, use_cache)
            htmls.append(html)
            times.append(time)
        return htmls,times
    else:
        url = str(url)
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
def get_titles(html, config):
    if config['title_xpath'] == '':
        return None
    if config.get('sub_page', False):
        result = []
        links = get_links(html, config)
        if links is not None:
            for sub_page in links:
                html, time = get_html(sub_page, config.get('use_cache', True))
                title = html.xpath(config['title_xpath'])
                for elem in title:
                    result.append(elem.xpath('string(.)').strip())
        if len(result) > 0:
            return result
        else:
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

def get_abstract(html, config):
    abstract_xpath = config.get('abstract_xpath', None)
    if abstract_xpath is None or abstract_xpath == '':
        return None
    if config.get('sub_page', False):
        result = []
        links = get_links(html, config)
        if links is not None:
            for sub_page in links:
                html,time = get_html(sub_page, config.get('use_cache', True))
                abstract = html.xpath(abstract_xpath)
                temp = ''
                for elem in abstract:
                    temp += elem.xpath('string(.)').strip()
                result.append(temp)
        if len(result) > 0:
            return result
        else:
            return None
    abstract = html.xpath(abstract_xpath)
    result = []
    for elem in abstract:
        result.append(elem.xpath('string(.)').strip())
    if len(result) > 0:
        return result
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
                if isinstance(official_file, list):
                    official_file = official_file[0].split('-')[0] + '.json'
                json_details = official_file[:official_file.index('.')] + '.json'
                print(f'Use official data for {publication} {one_site_config["year"]}')
                with open(os.path.join('official_cache',json_details), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for paper_detail in data:
                        paper_id += 1
                        one_paper_info = PaperInfo(
                            id=paper_id,
                            year=one_site_config['year'],
                            title=paper_detail['title'],
                            category=publication_config.get('category', '#'),
                            publication=paper_detail.get('publication', publication_config['name']),
                            paper=paper_detail.get('paper', '#'),
                            abstract=paper_detail.get('abstract', '#'),
                            status=one_site_config.get('status', 'notchecked')
                        )
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
                        abstracts = []
                        for h in html:
                            titles += get_titles(h, one_site_config)
                            links += get_links(h, one_site_config)
                            abstracts += get_abstract(h, one_site_config)
                        if links is not None:
                            assert(len(links)==len(titles))
                        if abstracts is not None:
                            assert (len(titles)==len(abstracts))
                    else:
                        titles = get_titles(html, one_site_config)
                        links = get_links(html, one_site_config)
                        abstracts = get_abstract(html, one_site_config)
                        if links is not None:
                            assert(len(links)==len(titles))
                        if abstracts is not None:
                            assert (len(abstracts)==len(titles))
                    for i in range(len(titles)):
                        t = titles[i].strip().replace('\n','')
                        paper_id += 1
                        
                        one_paper_info = PaperInfo(
                            id=paper_id,
                            year=one_site_config['year'],
                            title=t,
                            publication=publication_config['name'],
                            category=publication_config.get('category','#'),
                            paper='#' if links is None else one_site_config.get('link_prefix','')+links[i], # The url of the paper. If not found, return '#' by default.
                            abstract='#' if abstracts is None else abstracts[i],
                            status=one_site_config.get('status','notchecked')
                        )
                        yield one_paper_info

def export_data_json(project_base):
    config = get_config('data.yml')
    json_all = []
    meta_all = {}
    quick_view = []
    statistics = Statistics()

    color_set = ['--p-emerald-400','--p-lime-400','--p-red-400',
                 '--p-amber-400','--p-blue-400','--p-purple-400',]
    publication_acceptance_trend = {}
    for paper_info in fetch_one_paper_in_config(config):
        publication = paper_info.publication
        year = str(paper_info.year)

        # No abstract for small file
        no_abs_one_paper_info = {k:v for k,v in asdict(paper_info).items() if k!='abstract'}

        # Full paper info
        json_all.append(no_abs_one_paper_info)

        # Save meta data in official_cache
        meta_all.setdefault(publication,{})
        meta_all[publication].setdefault(year,[])
        meta_all[publication][year].append(asdict(paper_info))

        # Statistics
        statistics.total += 1
        statistics.byPublication.setdefault(publication,0)
        statistics.byPublication[publication] += 1
        statistics.byYear.setdefault(year,0)
        statistics.byYear[year] += 1
        statistics.byPublicationAndYear.setdefault(publication,{})
        statistics.byPublicationAndYear[publication].setdefault(year,0)
        statistics.byPublicationAndYear[publication][year] += 1
        
        statistics.byPublicationAndYearAndStatus.setdefault(publication,{})
        statistics.byPublicationAndYearAndStatus[publication].setdefault(year, paper_info.status)

        # Quick view: generate a small version of full paper info (100 latest paper from each publication)
        if statistics.byPublication[publication] <= 100:
            quick_view.append(no_abs_one_paper_info)

        # Overview
        publication_acceptance_trend.setdefault(paper_info.category,{})

        if publication not in publication_acceptance_trend[paper_info.category]:
            publication_acceptance_trend[paper_info.category][publication] = AcceptanceTrend(
                category=paper_info.category,
                label=publication,
            )

        publication_acceptance_trend[paper_info.category][publication].map_data.setdefault(year, 0)
        publication_acceptance_trend[paper_info.category][publication].map_data[year] += 1  
    for category, publication_names in publication_acceptance_trend.items():
        sub_color_set = color_set.copy()
        for publication_name, trend in publication_names.items():
            # trend.data = [i for i in dict(sorted(trend.map_data.items(), key=lambda x: x[0])).values()]
            trend.borderColor = sub_color_set.pop()
            statistics.overview.append(asdict(trend))
           
    statistics.byYear = dict(sorted(statistics.byYear.items(), key=lambda x: int(x[0])))
    statistics.years = list(statistics.byYear.keys())

    for json_name, json_file in {
        'data-statistics.json': statistics,
        'data-quick-view.json': quick_view,
        'data.json': json_all,
    }.items():
        if hasattr(json_file, '__dataclass_fields__'):
            json.dump(asdict(json_file), open(os.path.join(project_base + json_name), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        else:
            json.dump(json_file, open(os.path.join(project_base + json_name), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    if not os.path.exists('./src/assets/data/meta_json'):
        os.mkdir('./src/assets/data/meta_json')
    for publication in meta_all:
        for year in meta_all[publication]:
            json_file_name = os.path.join('./src/assets/data/meta_json',publication+' - '+year+'.json')
            json.dump(meta_all[publication][year],open(json_file_name, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

def prepare_official_data():
    """
    Parse csv/bib files for official data.
    Crawling website is not the best practice.
    If the official data file ends with ".json", it will not be processed.
    """

    def parse_csv_file(csv_file_names:list[str], __publication:str):
        from analyzers.csv_analyzer import CSV_SOURCE
        csv = CSV_SOURCE(__publication)
        if '-' in csv_file_names[0]:
            json_file_name = csv_file_names[0].split('-')[0] + '.json'
        else:
            json_file_name = csv_file_names[0].replace('.csv', '.json')
        all_results = []
        for csv_file_name in csv_file_names:
            check = csv.analyze_csv(os.path.join('official_cache',csv_file_name))
            if check:
                all_results += csv.dump()
        if len(all_results) > 0:
            with open(os.path.join('official_cache',json_file_name), 'w', encoding='utf8') as f:
                json.dump(all_results,f,ensure_ascii=False)
        return len(all_results)

    def parse_bib_file(bib_file_names:list[str], __publication:str):
        from analyzers.bib_analyzer import BIB_OBJ
        bib = BIB_OBJ(__publication)
        if '-' in bib_file_names[0]:
            json_file_name = bib_file_names[0].split('-')[0] + '.json'
        else:
            json_file_name = bib_file_names[0].replace('.bib', '.json')
        all_results = []
        for bib_file_name in bib_file_names:
            check = bib.analyze_bib(os.path.join('official_cache',bib_file_name))
            if check:
                all_results += bib.dump()
        if len(all_results) > 0:
            with open(os.path.join('official_cache',json_file_name), 'w', encoding='utf8') as f:
                json.dump(all_results,f,ensure_ascii=False)
        return len(all_results)
    config = get_config('data.yml')
    for publication in config:
        publication_config = config[publication]
        for one_site_config in publication_config['sites']:
            official_file = one_site_config.get('official_file',None)
            if official_file is None: continue
            # parsed data will be cached in .json file
            if isinstance(official_file, str):
                json_file = official_file[:official_file.index('.')] + '.json'
                official_files = [official_file]
            elif isinstance(official_file, list):
                json_file = official_file[0][:official_file[0].index('-')] + '.json'
                official_files = official_file
            else:
                raise ValueError('official_file must be str or list of str')
            if not os.path.exists(os.path.join('official_cache',json_file)):
                for official_file in official_files:
                    if official_file.endswith('csv'):
                        paper_num = parse_csv_file(official_files, publication_config['name'])
                    elif official_file.endswith('bib'):
                        paper_num = parse_bib_file(official_files, publication_config['name'])
                    else:
                        paper_num = 0
                    print(f"Generating official data for {publication} {one_site_config['year']} : {paper_num} papers")




def title_exists_in_file(file_path: str, title: str) -> bool:
    """
    Return True if `title` already appears under the "title" key
    in any JSON line inside `file_path`.
    """
    if not os.path.exists(file_path):
        return False

    with open(file_path, 'r', encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            if record.get('title') == title:
                return True
    return False

def titles_in_file(file_path: str) -> set:
    """
    Return True if `title` already appears under the "title" key
    in any JSON line inside `file_path`.
    """
    title_set = set()
    if not os.path.exists(file_path):
        return set()

    with open(file_path, 'r', encoding='utf-8') as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            if record['model_used'] != 'gemini-3-pro': # DEBUG: only consider gemini-3-pro results
                continue
            title_set.add(record.get('title_en'))
    return title_set
def analyze_abstracts_and_titles():
    from analyzers.llm_analyzer import analyze_title_and_abs
    config = get_config('data.yml')
    os.makedirs('official_cache/advanced_data', exist_ok=True)
    title_cache = {}
    for paper_info in fetch_one_paper_in_config(config):
        log_file_path = os.path.join('official_cache/advanced_data', f"{paper_info.publication} - {paper_info.year} - advanced.jsonl")
        if log_file_path not in title_cache:
            title_cache[log_file_path] = titles_in_file(log_file_path)
        if paper_info.title in title_cache[log_file_path]:
            continue  # Already analyzed
        if len(paper_info.abstract) > 50 and paper_info.status != 'advanced':
            result = analyze_title_and_abs(paper_info.title, paper_info.abstract)
            print(f"Analyzed {paper_info.title} : {result.get('topics_en', 'unknown')}")
            if result.get('topics_en', 'unknown') != 'unknown':
                with open(log_file_path, 'a', encoding='utf-8') as log_file:
                    log_file.write(json.dumps(result, ensure_ascii=False)+'\n')
                    log_file.flush()
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Helper")
    parser.add_argument(
        '--unzip',
        action='store_true',
        help="Unzip source"
    )
    parser.add_argument(
        '--zip',
        action='store_true',
        help="Zip source"
    )
    parser.add_argument(
        '--analyze',
        action='store_true',
        help="Generate new json files"
    )
    parser.add_argument(
        '--llm-analyze',
        action='store_true',
        help="Analyze papers' abstract with LLM"
    )
    args = parser.parse_args()

    if args.analyze:
        if os.path.exists('official_cache'):
            prepare_official_data()
        export_data_json('src/assets/data/')
    if args.zip:
        zip_manager.generate_zip_cache()
    if args.unzip:
        zip_manager.unzip_encrypted_zip()
    if args.llm_analyze:
        analyze_abstracts_and_titles()
    print('All done.')
