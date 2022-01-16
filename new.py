import requests
import json
import notion
import os, os.path
from pprint import pprint
from datetime import datetime

def print_menu(options):
    print(30 * '-')
    print("   MENU")
    print(30 * '-')
    for i in range(len(options)):
        print("{}. {}".format(i, options[i]))
    print(30 * '-')

def get_slug(folder, path):
    if folder == "booknotes":
        # todo: slugify title (or just space->'-', remove special chars, and and lower case? )
        title_slug = input('title-slug:')
        return "book-notes-{}".format(title_slug), "Book Notes: {}".format(title_slug), title_slug

    if folder in ["musicmonday","news"]:
        fileNumber = len([name for name in os.listdir(path) if name.endswith('.md')])   #os.path.isfile(os.path.join(path, name))]))
        if folder == "musicmonday":
            p_slug = 'music-monday-{}'
            t_slug = 'Music Monday #{}:' 
        else:
            p_slug = "geekosaur-news-{}"
            t_slug = 'Geekosaur Weekly #{}:' 

        return p_slug.format(fileNumber+1), t_slug.format(fileNumber+1)

    # todo: slugify title (or just space->'-', remove special chars, and and lower case? )
    slug = input("slug: ")
    return slug, slug, slug


folders = ["2022","drafts","booknotes","foreignlanguage","musicmonday","news","tvmovienotes"]

metadata = """---
date: '{}T16:00:00Z'
title: "{}"
description: ""
lead: ""
draft: true
# thumbnail: /img/
slug: '{}'
tags:
# reddit: 
# tweetId: ''
---

{{% figure "src","caption","vertical","alt" %}}

{{% blur "src","caption","vertical","alt" %}}

{{% youtube '' %}}

{{% reddit '' %}}

<div class="cards">
{{% card "title","cover","rating","review","goodreads" %}}
</div>
"""

print_menu(folders)
choice = input('Which folder: ')

folder = folders[int(choice)]

path = "src/posts/{}".format(folder)

slug, title, filename = get_slug(folder, path)

filename = filename if (filename != None and filename != "") else slug
print(filename, slug, title)


fileText = metadata.format(datetime.today().strftime('%Y-%m-%d'), title, slug)
print(fileText)

with open('{}/{}.md'.format(path, filename), mode='w') as mdfile:
    mdfile.write(fileText)
    