---
layout: layouts/note.njk
# add tags after changing layout and having a filter for note tags
# tags: ["detail"] 
pagination:
  data: notes
  size: 1  
  alias: note
  addAllPagesToCollections: true
eleventyComputed:
  title: "{{ note.title }}"
  # date: "{{ note.created_time }}"
  description: "{{ note.content | twitterExerpt }}"
  thumbnail:  "{{ note | getNoteThumbnail }}"
  created_date: "{{ note.created_time }}"
permalink: "note/{{ note.id }}/"
---

{{ note.content }}

{% anyEmbed note.embed %}

{% for image in note.images %}

{% figure image %}

{% endfor %}
