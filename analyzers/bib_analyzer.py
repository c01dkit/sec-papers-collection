import os
import re
import bibtexparser
import uuid
import sys

class BIB_OBJ:
    def __init__(self, publication):
        self.publication = publication
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
                    'paper': entry['url'],
                    'publication': self.publication,
                })
        return self.result
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