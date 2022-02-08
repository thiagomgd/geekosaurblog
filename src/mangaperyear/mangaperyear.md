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

{%- for year, bookList in manga | dictsort | reverse -%}

### {{ year }} ({{ bookList | length }} read)

<div class="cards">
<!-- TODO: sort by rating and date -->
{% for book in bookList -%}
{% card book.title,book.cover,book.rating,book.review %}
{% endfor -%}
</div>

{% endfor -%}