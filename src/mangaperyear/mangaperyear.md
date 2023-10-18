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

{%- for year, seriesList in manga | dictsort | reverse %}

### {{ year }} ({{ seriesList | getTotalForDict }} read)

{% for series, mangaList in seriesList %}
<b>{{ series }} ({{mangaList | length}})</b>

<div class="library">
{% for manga in mangaList | sortAndFilterManga %}
<div>{{ manga.title }}</div>
<div></div>
<div>{{ manga['Star Rating'] }}</div>
{% endfor -%}
</div>

{% endfor %}

{% endfor %}
