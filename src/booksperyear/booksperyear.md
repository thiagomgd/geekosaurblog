---
layout: layouts/post.njk
date: "2022-02-05"
title: "Books Read"
toc: true
templateClass: tmpl-post
permalink: /books-per-year/
tweetId: "1393699018597797893"
reddit: https://www.reddit.com/r/geekosaur/comments/ndaaoc/books_per_year/
eleventyNavigation:
  key: Books Read
  order: 4
---

{% for booksYear in booksRead -%}
### {{ booksYear.year }}

<div class="cards">
{% for book in booksYear.books -%}
{% card book.title,book.cover,book.rating,book.review %}
{% endfor -%}
</div>

{% endfor -%}