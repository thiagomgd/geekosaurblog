---
categories:
- Coding
date: "2021-04-27T21:11:01-07:00"
description: After showing how to automate downloading images and videos from Reddit
  comments, I'm adding one extra step and making it also find the correct posts for
  me.
draft: false
thumbnail: https://i.imgur.com/9u3PBtG.png
reddit: https://www.reddit.com/r/geekosaur/comments/n06zhy/automating_things_downloading_reddit_media_part_2/
slug: automating-downloading-reddit-images-part2
tags:
- Automating
title: 'Automating Things: Downloading Reddit Media Part #2'
toc: false
tweetId: "1387263984001191936"
---

Recently I shared a post on how to automate [downloading images and videos from Reddit comments](/posts/automating-downloading-reddit-images/), as well as saving links present in those comments. Today I'm adding one extra step, and making it also find the correct posts for me. That way I can download screenshots and videos for a whole show!

{% figure "https://i.imgur.com/9u3PBtG.png" %}

<!--more-->

We already have a script that is able to download an entire post. So, how can we easily find all the discussion posts for an anime? The answer is way simpler than you may think:

```python
def search_posts(reddit, query='', subreddit='anime', sort='new', t='year', flair='Episode', l=None):
        if flair and flair != '':
            query = ' '.join((query, 'flair_name:"{}"'.format(flair)))
        
        sr = reddit.subreddit(subreddit)
        post_list = sr.search(query, sort=sort, syntax='lucene',
                              time_filter=t, limit=l)

        posts = [post.id for post in post_list]
        
        return posts
```

This `search_posts` function receives a few parameters, and some have default values to make usage simpler. They are:

- `reddit`: an instance of the `praw` object we use to interact with Reddit's API
- `query`: the actual search, which for us is the anime title + season (optional). I.e: `Boku No Hero Academia` or `Boku No Hero Academia Season 5`
- `subreddit`: the desired subreddit. Default is `anime`
- `sort`: The order of the results. Let's have `new` as default
- `t`: Time. Defaults to a year
- `flair`: Anime discussions use the `Episode` flair
- `l`: Limit. Although the default here is no limit, that's being defaulted to 24 when reading the parameters
`

To run that, before downloading:
```python
reddit = praw.Reddit(
        user_agent=user_agent, client_id=config["client_id"], client_secret=config["client_secret"])

search_term =  sys.argv[1]
limit = int(sys.argv[2]) if len(sys.argv) >= 3 else 24
posts = search_posts(reddit, search_term, l=limit)
print('{} posts found'.format(len(posts)))

download_posts_media(reddit, posts)
```

This will:

- Initiate our `praw` object, connecting to Reddit
- Read the `search_term` from the parameters
- Read the `limit` from the parameters, or default to 24
- Seach
- Print how many posts were found
- download

To call it, you can do:

- `python3 gist_reddit_downloader_search.py 'Boku No Hero Season 5' 12`
- `python3 gist_reddit_downloader_search.py 'Boku No Hero' 12`
- `python3 gist_reddit_downloader_search.py 'Boku No Hero'`

Please note that on Reddit they use the Japanese title for the discussions. Hope that's useful for all weebs that love to have all those screenshots on our computer! May the collection of reaction images be with you. The whole script, along with instructions [can be downloaded here](https://gist.github.com/thiagomgd/04dddb307b421d5f10986414d018c1ba).
