import json
import ruamel.yaml


f = open('post_to_export.json')
postsData = json.load(f)

for postId in postsData:
    post = postsData[postId]
    print(post)


