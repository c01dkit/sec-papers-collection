import zipfile
import pyzipper
import os
from dotenv import load_dotenv
load_dotenv()
PRIVATE_ZIP_PASSWD = os.getenv('PRIVATE_ZIP_PASSWD').encode()

def generate_zip_cache():
    cache_dir = './cache'
    with zipfile.ZipFile('cache.zip', "w", zipfile.ZIP_DEFLATED) as zpf:
        for path, _, filenames in os.walk(cache_dir):
            for filename in filenames:
                zpf.write(os.path.join(path, filename), os.path.join(path, filename))
    cache_dir = './official_cache'
    with pyzipper.AESZipFile('private_source.zip', 'w', compression=pyzipper.ZIP_DEFLATED, encryption=pyzipper.WZ_AES) as zpf:
        zpf.setpassword(PRIVATE_ZIP_PASSWD)
        for path, _, filenames in os.walk(cache_dir):
            for filename in filenames:
                zpf.write(os.path.join(path, filename), os.path.join(path, filename))
        zpf.setencryption(pyzipper.WZ_AES, pwd=PRIVATE_ZIP_PASSWD)

def unzip_encrypted_zip():
    zip_file = 'private_source.zip'
    output_dir = '.'
    if os.path.exists(zip_file):
        with pyzipper.AESZipFile(zip_file, 'r') as zpf:
            zpf.pwd = PRIVATE_ZIP_PASSWD
            zpf.extractall(output_dir)