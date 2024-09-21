import pandas as pd
import os
import chardet
import json



class XPLORE:
    def __init__(self, publication):
        self.df = None
        self.encoding = None
        self.publication = publication
        self.result = []
        pass
    def dump(self):
        for index, row in self.df.iterrows():
            if type(row['Author Affiliations']) is str:
                self.result.append({
                    'title':row['Document Title'],
                    'authors':row['Authors'],
                    'abstract':row['Abstract'],
                    'paper':row['PDF Link'],
                    'publication':self.publication,
                })
            elif len(self.result) <= 5:
                # Assure that all papers are consistent
                # NOTE assure at least 5 papers are accepted
                self.result = []
        return self.result
    def analyze_csv(self, filename):
        if os.path.exists(filename):
            with open(filename, 'rb') as f:
                result = chardet.detect(f.read())
            self.encoding = result['encoding']
            if self.encoding != 'utf-8':
                print(f'Failed to detect encoding: {self.encoding} of {filename}')
                return False
            df = pd.read_csv(filename, encoding=self.encoding)
            self.df = df
            return True
        else:
            print(f'File {filename} does not exist')
            return False

def test():
    root = './official_cache'
    for target in ['oakland24','oakland23','oakland22']:
        xplore = XPLORE()
        xplore.analyze_csv(os.path.join(root,target+'.csv'))
        res = xplore.dump()
        with open(os.path.join(root,target+'.json'),'w',encoding='utf8') as f:
            json.dump(res,f,ensure_ascii=False)


if __name__ == '__main__':
    test()