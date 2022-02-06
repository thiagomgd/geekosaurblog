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

{% for mangaYear in mangaRead -%}
### {{ mangaYear.year }}

<div class="cards">
{% for manga in mangaYear.books -%}
{% card manga.title,manga.cover,manga.rating,manga.review %}
{% endfor -%}
</div>

{% endfor -%}