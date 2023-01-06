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

result = {
  v: "/textures/" + v \
  for v in result
}

os.chdir(CURDIR)
with open("manifest.json", "w") as f:
  json.dump(result, f, indent=2),
