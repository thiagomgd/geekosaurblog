---
layout: layouts/post.njk
# date: "2021-04-20"
title: "Comics/Manga Read"
toc: true
templateClass: tmpl-post
permalink: /comics-manga-read/
tweetId: "1490141415648620545"
reddit: https://www.reddit.com/r/geekosaur/comments/slmyne/comicsmanga_read/
eleventyNavigation:
  key: Comics/Manga Read
  order: 6
---

{%- for year, bookList in manga | dictsort | reverse -%}

### {{ year }} ({{ bookList | length }} read)

<div class="library">
{% for book in bookList -%}
<div>{{ book.Title }}</div>
<div>{{ book.Authors }}</div>
<div>{{ book['Star Rating'] }}</div>
{% endfor -%}
</div>

{% endfor -%}
