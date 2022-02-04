---
layout: layouts/post.njk
# tags: ["detail"]
pagination:
  data: notes
  size: 1  
  alias: note
  addAllPagesToCollections: true
eleventyComputed:
  title: "{{ note.title }}"
  date: "{{ note.created_time | readableDate }}"
permalink: "note/{{ note.id }}/"
---

{{ note.title }} {{ note.created_time | readableDate }}

{{ note.content }}
