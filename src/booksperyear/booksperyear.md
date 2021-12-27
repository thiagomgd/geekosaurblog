---
layout: layouts/post.njk
# date: "2021-04-20"
title: "Books Per Year"
toc: true
templateClass: tmpl-post
permalink: /books-per-year/
tweet: 1393699018597797893
reddit: https://www.reddit.com/r/geekosaur/comments/ndaaoc/books_per_year/
eleventyNavigation:
  key: Books Per Year
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