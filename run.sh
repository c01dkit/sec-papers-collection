#!/bin/bash
python3 main.py
echo -e "\033[0;32mSynchronizing updates to Github...\033[0m"

git add .
d=`date`
msg="Sync raw data at $d"
if [ $# -eq 1 ]
  then msg="$1"
fi
git commit -m "$msg"
git push

echo -e "\033[0;32mDeploying updates to GitHub...\033[0m"
mkdocs gh-deploy --clean