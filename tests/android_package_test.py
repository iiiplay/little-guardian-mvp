"""Validate the actual served update manifest, APK, signer continuity and packaged game."""
import hashlib
import json
import os
import pathlib
import re
import subprocess
import urllib.request
import zipfile

root = pathlib.Path(__file__).resolve().parents[1]
env = os.environ.copy()
env.setdefault('JAVA_HOME', str(pathlib.Path(env['LOCALAPPDATA']) / 'Android/jdk/17'))
sdk = pathlib.Path(env.get('ANDROID_HOME', str(pathlib.Path(env['LOCALAPPDATA']) / 'Android/Sdk')))
build_tools = sdk / 'build-tools/35.0.1'
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
with opener.open('http://192.168.0.33:8765/dist/android/update.json', timeout=10) as response:
    manifest = json.load(response)
apk = root / 'dist/android' / manifest['apkUrl'].rsplit('/', 1)[1]
with opener.open(manifest['apkUrl'], timeout=15) as response:
    served = response.read()
assert served == apk.read_bytes(), 'served APK differs from built artifact'
assert len(served) == manifest['sizeBytes']
assert hashlib.sha256(served).hexdigest() == manifest['sha256']
with zipfile.ZipFile(apk) as archive:
    assert archive.read('assets/index.html') == (root / 'dist/game.html').read_bytes()

def signing(path):
    output = subprocess.check_output([str(build_tools / 'apksigner.bat'), 'verify', '--print-certs', str(path)], env=env, text=True)
    return re.search(r'Signer #1 certificate SHA-256 digest: (\w+)', output).group(1)

signer = signing(apk)
previous = root / 'dist/android/LittleGuardian-0.10.0-debug.apk'
if previous.exists():
    assert signing(previous) == signer, 'signer changed: existing saves cannot be updated in place'
badging = subprocess.check_output([str(build_tools / 'aapt.exe'), 'dump', 'badging', str(apk)], env=env, text=True, encoding='utf-8')
assert "name='com.iiiplay.littleguardian'" in badging
assert f"versionCode='{manifest['versionCode']}'" in badging
assert f"versionName='{manifest['versionName']}'" in badging
assert "sdkVersion:'26'" in badging
report = dict(passed=True, versionCode=manifest['versionCode'], versionName=manifest['versionName'],
              bytes=len(served), sha256=manifest['sha256'], signerSha256=signer,
              checks=['LAN manifest and APK download', 'size and SHA256', 'same signer as test.1',
                      'package/version/minSdk', 'embedded game matches distribution'],
              androidRuntimeTested=False)
(root / 'artifacts/android-update-package-results.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('PASS: served update manifest/APK, checksum, signer continuity, package version and embedded game.')
