import os
import re
import bibtexparser
import uuid
import sys

class BIB_OBJ:
    def __init__(self, publication, url_template=None):
        self.publication = publication
        # 只有 data.yml 里显式配了 paper_url_template 的会议才会用它兜底，缺 url 时
        # 用 {id} 占位符拼 bib 的 entry key。不做「key 长得像什么就猜是什么库」的推断：
        # 猜错的话产出的是一个静默的死链，没人会发现。
        self.url_template = url_template
        self.result = []
        self.bib = None

    def dump(self):
        for entry in self.bib.entries:
            if 'abstract' in entry: # for some years, Session metadata is included, which lacks abstract.
                short_abstract = entry['abstract'].replace('\n', ' ')
                short_abstract = re.sub(r'\s+', ' ', short_abstract)
                self.result.append({
                    'title': entry['title'].strip(),
                    'authors': entry['author'],
                    'abstract': short_abstract,
                    'paper': self.paper_url(entry),
                    'publication': self.publication,
                })
        return self.result

    def paper_url(self, entry):
        # ACM DL 里由 USENIX 出版的会议（OSDI 全系列）导出的 bib 没有 url/doi 字段，
        # 直接 entry['url'] 会 KeyError，整个 --analyze 挂掉。没有 url 又没配模板时
        # 返回 '#'——和 main.py 里 paper_detail.get('paper', '#') 的兜底一致。
        if 'url' in entry:
            return entry['url']
        entry_id = entry.get('ID', '')
        if self.url_template and entry_id:
            return self.url_template.replace('{id}', entry_id)
        return '#'

    def analyze_bib(self, filename):
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf8') as f:
                self.bib = bibtexparser.load(f)
                return True
        else:
            print(f'{filename} not found')
            return False
        
    def fix_bib_name(self, filename):
        origin_file = open(filename, 'r', encoding='utf8')
        result = []
        for line in origin_file:
            fixed_line = line
            if line.startswith('@INPROCEEDINGS {,'):
                new_id = str(uuid.uuid4()).replace('-', '')
                fixed_line = f'@INPROCEEDINGS {{{new_id},\n'
            elif line.startswith('title = {{'):
                fixed_line = line.replace('{{', '{').replace('}}', '}')
            result.append(fixed_line)
        origin_file.close()
        fixed_file = open(filename, 'w', encoding='utf8')
        fixed_file.writelines(result)
        fixed_file.close()

if __name__ == '__main__':
    bib_analyzer = BIB_OBJ(publication='Sample Conference')
    bib_file = sys.argv[1]
    bib_analyzer.fix_bib_name(bib_file)
    # uv run analyzers/bib_analyzer.py official_cache/oakland26.bib