import requests
import json
import notion
import os, os.path
from pprint import pprint
from datetime import datetime

def load_json():
    toots = {}

    # for now, reading directly from here instead of possibly different sources
    with open('src/_cache/linksuniverseodon.json', 'r') as json_file:
        toots = json.load(json_file)

    return toots['posts']

def save_json(toot):
    with open('src/_cache/linksuniverseodon.json', "w") as f:
        json.dump(toots, f, indent=4)

def get_slug(folder, path):
    fileNumber = len([name for name in os.listdir(path) if name.endswith('.md')])  

    p_slug = 'links-{}'
    t_slug = 'Links #{}:'

    return p_slug.format(fileNumber+1), t_slug.format(fileNumber+1)

metadata = """---
date: '{}T16:30:00.000-07:00'
title: "{}"
description: ""
lead: ""
slug: '{}'
tags:
- draft
---

{{% linksPost mylinks[slug] %}}

"""

folder = 'links'

path = "src/posts/{}".format(folder)

slug, title = get_slug(folder, path)

print(slug, title)

fileText = metadata.format(datetime.today().strftime('%Y-%m-%d'), title, slug)
print(fileText)
    #   "linksPost": "links-1",


toots = load_json()

for toot in toots:
    if 'linksPost' in toot:
        break
    toot['linksPost'] = slug

with open('{}/{}.md'.format(path, slug), mode='w') as mdfile:
    mdfile.write(fileText)
    
save_json(toots)
