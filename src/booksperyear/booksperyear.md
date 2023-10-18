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

<div class="library">
{% for book in bookList -%}
<div>{{ book.Title }}</div>
<div>{{ book.Authors }}</div>
<div>{{ book['Star Rating'] }}</div>
{% endfor -%}
</div>

{% endfor -%}