---
layout: layouts/post.njk
# date: "2021-04-20"
title: "Comics/Manga Read"
toc: true
templateClass: tmpl-post
permalink: /comics-manga-read/
tweetId: "1393699018597797893"
# reddit: https://www.reddit.com/r/geekosaur/comments/ndaaoc/books_per_year/
eleventyNavigation:
  key: Comics/Manga Read
  order: 5
---

{% for mangaYear in mangaRead -%}
### {{ mangaYear.year }}

<div class="cards">
{% for manga in mangaYear.books -%}
{% card manga.title,manga.cover,manga.rating,manga.review %}
{% endfor -%}
</div>

{% endfor -%}