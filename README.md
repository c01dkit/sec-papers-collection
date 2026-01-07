# A Collection of Security Papers on Top-Tier Conferences

## TLDR

This website serves as a curated collection for academic and technical research in the field of cybersecurity.

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

## How to contribute?

You can simply clone the repository, update the `data.yml` file, run `uv run main.py --analyze` locally to make sure everything works well, and create a Pull Request (PR). I will review it and update the website as soon as possible. All contributors will be listed in the repository's README and in the website's acknowledgments :)

### Update paper details

The paper source is processed via `uv` project manager. You should run `uv sync` to setup the environment first. Then, to update, first switch to `main` branch and simply update `data.yml` and run `uv run main.py --analyze` to crawl and generate the latest information! Then I will update my branch and deploy it. To speed up website crawling, you can unzip the `cache.zip` file and place the `cache` directory under the root path of the project.

### Update key information

* Since v0.3.6, keyword `status` is introduced into `data.yml` to mark the conference status. Status can be grouped into `notchecked` (default), `inprogress`, `done`, and `advanced`, corresponding to `Not verified`, `Require updates`, `Verified`, and `Advanced processed`.
* Since v0.3.0, `src/service/xxxService.js` files are used for some key information other than paper details. You can easily update them for the latest news.

## For local deploy and publish

To build and publish the website, run the following script:

```shell
uv run main.py --analyze --zip
npm run build
npm run deploy # before this, you should update package.json and set correct --cname
git add .
git commit -m "update $DATE"
git push origin main
```