import os
import json

CURDIR = os.path.dirname(os.path.realpath(__file__))
PATH = os.path.join(CURDIR, "../../public/textures")

os.chdir(PATH)

result = [
  os.path.join(dp, f) \
  for dp, dn, filenames in os.walk(".") \
    for f in filenames
]

result = [
  s[2:].replace("\\", "/") \
  for s in result
]

preload = {
  v: "/textures/" + v \
  for v in result \
  if not v.startswith("cards")
}

os.chdir(CURDIR)
with open("manifest.json", "w") as f:
  json.dump(preload, f, indent=2),

extra = {
  v: "/textures/" + v \
  for v in result \
  if v.startswith("cards")
}

os.chdir(CURDIR)
with open("manifest_1.json", "w") as f:
  json.dump(extra, f, indent=2),
