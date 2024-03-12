---
aliases:
  - /posts/automating_downloading_reddit_images/
categories:
  - Coding
date: 2021-04-10T17:08:24-07:00
description: Going back in time, about 6 years ago (I'm getting old....), and maybe 3 or 4 different blogs/domains, I was writing anime reviews as a way to practice my English writing skills. And part of doing anime reviews is getting images and gifs, right? At the beginning, I would go to reddit.com/r/anime, open the episode's discussion post, expand all images (with the help of RES - reddit enhancement suite), scroll to see whatever I liked and grab it. But this is not optimal, and being a developer, I started thinking of something more practical.
draft: false
slug: automating-downloading-reddit-images
tags:
  - automating
title: "Automating Things: Downloading Reddit Media"
---

This week, Crow published an interesting [post about automating blog tasks](https://www.crowsworldofanime.com/posts/automating-blog-tasks-blog-shop-talk/). That reminded me of a few things I have done but never shared here (or on one of my previous blogs), and I think it's time to post them here.

Going back in time, about 6 years ago (I'm getting old....), and maybe 3 or 4 different blogs/domains, I was writing anime reviews as a way to practice my English writing skills. And part of doing anime reviews is getting images and gifs, right? At the beginning, I would go to reddit.com/r/anime, open the episode's discussion post, expand all images (with the help of RES - reddit enhancement suite), scroll to see whatever I liked and grab it. But this is not optimal, and being a developer, I started thinking of something more practical.

![](https://i.imgur.com/tBhj7cK.png)

<!--more-->

That's when I decided to create a script to do this for me. The basic idea is: I give it a list of discussion posts, the script would check all comments for links, download images, gifs and videos, and save some other things that I might want, like wikipedia and myanimelist links. For that - and everything that came after - I decided to use Python, which is (generally speaking) a high-level general purpose interpreted scripting language (I'm just throwing all mumble-jumble together). That means: it's quick and easy to write and run those simple automations [*citation needed*].

Now, I wrote this many years ago, and the goal was not to have a robust and elegant solution, but to save time when downloading images from Reddit. So it might not be perfect or very well written an organized, but it works for what I want. Let's get started with how to do it!

If you just want to run the thing, feel free to go [HERE](https://gist.github.com/thiagomgd/4566ea92084f328c62ea6116521b959e) on github and grab the code. This post will not explain absolutely everything anyway.

This snippet below basically says:

- I want to download everything to `downloaded`
- I want to save errors, saved links (wikipedia, myanimelist) and output to these files
- Initiate the praw instance
- If you only have one code - not a list - turn it into a list

```python
folder = "downloaded/"

if not os.path.exists(folder):
	os.makedirs(folder)

errors_file = open("{}error_logs.txt".format(folder), "a+", encoding="utf-8")
saved_links = open("{}saved_links.txt".format(folder), "a+", encoding="utf-8")
print_output = open("{}output.txt".format(folder), "a+", encoding="utf-8")

reddit = praw.Reddit(
		user_agent=user_agent, client_id=config["client_id"], client_secret=config["client_secret"])

if not isinstance(submission_list, list):
		submission_list = [submission_list]
```

Below is the main logic for each post:

- Load post (submission) with praw
- Create subfolder with the subreddit's name, then another with the post's title
- Expand comment replies, download, expand, and keep repeating until there are no more comments

```python
comments = []
ignored = {}
exceptions = {}
submission = reddit.submission(id=submission_id)

my_print('Getting submission {} {}'.format(submission_id, submission.title))

download_folder = "{}{}/".format(folder, valid_filename(submission.subreddit.display_name))
comments_folder = "{}[{}]-{}/".format(download_folder, submission.id, submission.title)

if not os.path.exists(comments_folder):
    os.makedirs(comments_folder)       

submission.comments.replace_more(limit=None)
comment_queue = submission.comments[:]  # Seed with top-level

i = 0
while comment_queue:
    i = i+1
    comment = comment_queue.pop(0)

    comments.append(format_comment_dict(comment))
    url_list = get_links(comment)

    download_links(comments_folder, url_list)
    comment_queue.extend(comment.replies)

errors_file.flush()
saved_links.flush()
print_output.flush()
os.fsync(errors_file.fileno())
os.fsync(saved_links.fileno())
os.fsync(print_output.fileno())

time.sleep(0.1)
```

Now, let's see how `get_links` works. Because Reddit uses Markdown to format the comments, links are saved as `[TITLE](URL)`, which means I basically have to search the text for this pattern (hence those 3 regular expressions).

```python
def get_links(comment):
    # Links without title are not processed for now :(

    # Anything that isn't a square closing bracket
    name_regex = "[^]]+"
    # http:// or https:// followed by anything but a closing parentheses
    url_regex = "http[s]?://[^)]+"
    markup_regex = "\[({0})]\(\s*({1})\s*\)".format(name_regex, url_regex)
    ret = re.findall(markup_regex, comment.body)
    links = []
    for itm in ret:
        links.append({"title": itm[0], "url": itm[1]})

    return links
```

As for `download_links`, I check what's the link type, and then realize that action. Basically, do something different if it's imgur, gfycat, or whatever. The functions is on the inverse order to make reading easier (I guess?). Also, only added 1 example of the actions, but that's the idea: each different domain or type of link will have a different action that's executed.

```python
def download_links(folder, links):
    for link in links:
        link_action = check_link_action(link["url"])
        my_print(link["url"])
        actions[link_action](folder, link)

def check_link_action(url):
    if url.endswith(".gifv"):
        return "special_imgur_gifv"
    elif url.endswith(config["desired_files"]):
        return "download"
    elif "imgur.com/a/" in url:
        return "special_imgur_album"
    elif "imgur.com/gallery/" in url:
        return "special_imgur_album"
    elif "imgur" in url:
        return "special_imgur_image"
    elif "gfycat" in url:
        return "special_gfycat"
    elif "streamable" in url:
        return "special_streamable"
    elif any(x in url for x in config["wanted_links"]):
        return "save"
    else:
        return "ignore"

actions = {
    "download": download_link,
    "special_imgur_album": special_imgur_album,
    "special_imgur_image": special_imgur_image,
    "special_imgur_gifv": special_imgur_gifv,
    "special_gfycat": special_gfycat,
    "special_streamable": special_streamable,
    "save": save_link,
    "ignore": ignore_link,
}

def special_imgur_image(folder, link):
    url = link["url"]
    fn = url[url.rfind('/')+1:]
    url = url[:url.rfind('/')+1] + "download/" + fn

    r = requests.get(url)
    if "Content-Type" in r.headers:
        try:
            ft = r.headers["Content-Type"]

            fn = fn + "." + ft[ft.rfind('/')+1:]
            fn = format_filename(folder, link["title"], fn)
            if not os.path.isfile(fn):
                os.makedirs(os.path.dirname(fn), exist_ok=True)
                with open(fn, 'wb') as outfile:
                    outfile.write(r.content)
        except Exception as e: 
            errors_file.write("{} | {}\n".format(url, e))
    else:
        errors_file.write("{} | {}\n".format("IGNORED:    ", url))
        ignore_link(folder, link)
```

And that's it!! 330 lines of code on the full script.

Let's try that: `python3 gist_reddit_downloader.py 'mo8289'` on the command-line.

![](https://i.imgur.com/xtFxVuQ.png)

It's beautiful!!!! Those subfolders are imgur albums, which are conveniently saved that way. Also, the filenames contain the title on the comment followed by imgur or gfycat's id. So, if you just want to link to the original url, you can use that. As an exercise, you can change the script to just save all links as embeds in an html file, so you can have you own local gallery.

As mentioned before, [the code is available here](https://gist.github.com/thiagomgd/4566ea92084f328c62ea6116521b959e). And feel free to reach out on Twitter, Reddit or by the comment form if you have any questions!
