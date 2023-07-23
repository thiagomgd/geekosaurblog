---
layout: layouts/post.njk
# date: "2022-04-20"
title: "Books Read"
toc: true
templateClass: tmpl-post
permalink: /books-per-year/
eleventyNavigation:
  key: Books Read
  order: 5
---

{%- for year, bookList in books | dictsort | reverse -%}

### {{ year }} ({{ bookList | length }} read)

<div class="cards">
{% for book in bookList -%}
{% card book.title,book.cover,book.tier,book.review %}
{% endfor -%}
</div>

{% endfor -%}