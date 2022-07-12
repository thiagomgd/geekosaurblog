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
  order: 5
---

{%- for year, seriesList in manga | dictsort | reverse %}

### {{ year }} ({{ seriesList | getTotalForDict }} read)

{% for series, mangaList in seriesList %}
<b>{{ series }}</b>

<div class="cards">
{% for manga in mangaList | sort(false, false, 'volume') %}
{% card manga.title, manga.cover, manga.rating, manga.review %}

{% endfor %}
</div>

{% endfor %}

{% endfor %}