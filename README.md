# A Collection of Security Papers on Top-Tier Conferences

**These papers are sorted by conference and date, and are deployed via github pages. Please [click here to visit the website](https://sec.c01dkit.com).**

The following publications are included:

- IEEE S&P (Oakland)
- USENIX Security Symposium (USENIX Sec)
- ACM CCS
- NDSS

Since some topics on software testing are related to security, the following publications are also included:

- ICSE
- ISSTA

**PRs and issues are warmly welcomed.**

## What about the previous one?

This website is version 2. I've rewritten the whole website and migrated it from Mkdocs to a Vue project.

The old version is archived in `archive_v1` branch.
You can switch to this branch and deploy the old one in your own website! 

## How to start a PR?

To speed up website crawling, you can unzip the `cache.zip` file and place the `cache` directory under the root path of the project.

### Update paper details

To update, first switch to `main` branch and simply update `data.yml` and run `main.py` to crawl and generate the latest information! Then I will update my branch and deploy it.

### Update key information

From v0.3.0, I gradually update src/service/xxxService.js files for some key information other than paper details. You can easily update them for the latest news.

## Do I have to register API keys for website crawling?

To offer accurate and legitimate information, some websites are requested via API. 
You can register your own API keys and set them in the `config.example.yml` and rename the file as `config.yml`.

## For Admin

To build and publish the website, run the following script:

```shell
python main.py
npm build
npm deploy
git add .
git commit -m "update $DATE"
git push origin main
```

## For advanced support

If you have a web server, you can set it up for advanced functionalities, such as search in full-text/abstract.

This requires that you have already run `python main.py` and generated all needed files.


