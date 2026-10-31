from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
paths=['companion-viewer/source','companion-viewer/portraits','companion-viewer/vite.config.mjs','companion-viewer/package.json','companion-viewer/package-lock.json','companion-viewer/LICENSE','companion-viewer/README.md','companion-viewer/credits.html','item-viewer/source','item-viewer/vite.config.mjs','item-viewer/package.json','item-viewer/README.md','item-viewer/credits.html','pet-platform-config.js','package.json','vendor/jelly-mobile','assets/models','assets/selected-items','assets/selected-pets','assets/selected-worlds','THIRD_PARTY_NOTICES.md']
out=root/'companion-viewer/licenses/moya-companion-source.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for name in paths:
  p=root/name
  if not p.exists():continue
  for f in ([p] if p.is_file() else p.rglob('*')):
   if f.is_file() and not any(x in f.relative_to(root).parts for x in ['node_modules','.git','.upstream-git']):z.write(f,f.relative_to(root))
 for folder in ['companion-viewer/licenses','item-viewer/licenses']:
  for f in (root/folder).glob('*'):
   if f.is_file() and f.suffix!='.zip':z.write(f,f.relative_to(root))
print(out.stat().st_size)
