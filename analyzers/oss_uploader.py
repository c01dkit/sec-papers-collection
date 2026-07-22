import os
import json
import hashlib
import oss2
from dotenv import load_dotenv

load_dotenv()

OSS_ACCESS_KEY_ID = os.getenv('OSS_ACCESS_KEY_ID')
OSS_ACCESS_KEY_SECRET = os.getenv('OSS_ACCESS_KEY_SECRET')
OSS_BUCKET = os.getenv('OSS_BUCKET')
OSS_ENDPOINT = os.getenv('OSS_ENDPOINT')

# Object key prefix inside the bucket. The CDN domain (cdn.c01dkit.com) is bound
# to the bucket root, so an object stored at `sec-papers/data.json` is served as
# https://cdn.c01dkit.com/sec-papers/data.json
OSS_PREFIX = 'sec-papers'
LOCAL_DATA_DIR = './src/assets/data'

# Local cache mapping each relative file path -> its SHA256. Files whose hash
# matches the cache are skipped on the next `--upload`. Not committed to git.
CACHE_FILE = './oss_upload_cache.json'


def _get_bucket():
    missing = [
        name for name, val in {
            'OSS_ACCESS_KEY_ID': OSS_ACCESS_KEY_ID,
            'OSS_ACCESS_KEY_SECRET': OSS_ACCESS_KEY_SECRET,
            'OSS_BUCKET': OSS_BUCKET,
            'OSS_ENDPOINT': OSS_ENDPOINT,
        }.items() if not val
    ]
    if missing:
        raise RuntimeError(
            'Missing OSS config in .env: ' + ', '.join(missing)
        )
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    return oss2.Bucket(auth, OSS_ENDPOINT, OSS_BUCKET)


def _file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 16), b''):
            h.update(chunk)
    return h.hexdigest()


def _iter_json_files(local_dir):
    for root, _, filenames in os.walk(local_dir):
        for filename in filenames:
            if not filename.endswith('.json'):
                continue
            local_path = os.path.join(root, filename)
            rel_path = os.path.relpath(local_path, local_dir).replace(os.sep, '/')
            yield local_path, rel_path


def _load_cache(cache_file):
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            print(f'  Warning: cache {cache_file} unreadable, treating as empty')
    return {}


def _save_cache(cache, cache_file):
    parent = os.path.dirname(cache_file)
    if parent:
        os.makedirs(parent, exist_ok=True)
    with open(cache_file, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2, sort_keys=True)


def upload_data_dir(local_dir=LOCAL_DATA_DIR, prefix=OSS_PREFIX,
                    cache_file=CACHE_FILE, force=False):
    """
    Upload every JSON file under `local_dir` to the OSS bucket, preserving the
    directory structure under `prefix/`. Files whose SHA256 matches the local
    cache are skipped. Pass force=True to re-upload everything.
    """
    if not os.path.isdir(local_dir):
        raise RuntimeError(f'Local data directory not found: {local_dir}')

    cache = {} if force else _load_cache(cache_file)
    new_cache = {}
    bucket = None  # created lazily so a no-op run needs no credentials/network
    uploaded = 0
    skipped = 0

    for local_path, rel_path in _iter_json_files(local_dir):
        digest = _file_hash(local_path)
        new_cache[rel_path] = digest
        if not force and cache.get(rel_path) == digest:
            skipped += 1
            continue
        if bucket is None:
            bucket = _get_bucket()
        key = f'{prefix}/{rel_path}'
        bucket.put_object_from_file(
            key,
            local_path,
            headers={'Content-Type': 'application/json; charset=utf-8'},
        )
        uploaded += 1
        print(f'  Uploaded {key}')

    _save_cache(new_cache, cache_file)
    print(f'Uploaded {uploaded} file(s), skipped {skipped} unchanged '
          f'(oss://{OSS_BUCKET}/{prefix}/)')
    return uploaded


def seed_upload_cache(local_dir=LOCAL_DATA_DIR, cache_file=CACHE_FILE):
    """
    Record the current hashes of all JSON files as already uploaded, WITHOUT
    uploading anything. Use this after a manual/first upload so subsequent
    `--upload` runs only push files that actually change.
    """
    if not os.path.isdir(local_dir):
        raise RuntimeError(f'Local data directory not found: {local_dir}')
    cache = {rel: _file_hash(path) for path, rel in _iter_json_files(local_dir)}
    _save_cache(cache, cache_file)
    print(f'Seeded upload cache with {len(cache)} file(s): {cache_file}')
    return cache
