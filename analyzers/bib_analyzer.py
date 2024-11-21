import os
import re
import bibtexparser


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
                    'title': entry['title'],
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