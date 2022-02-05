---
layout: layouts/post.njk
# add tags after changing layout and having a filter for note tags
# tags: ["detail"] 
pagination:
  data: notes
  size: 1  
  alias: note
  addAllPagesToCollections: true
eleventyComputed:
  title: "{{ note.title }}"
  date: "{{ note.created_time | readableDate }}"
  description: "{{ note.content | twitterExerpt }}"
permalink: "note/{{ note.id }}/"
---

{{ note.content }}

{% for image in note.images %}

{% figure image, "", "vertical" %}

{% endfor %}
