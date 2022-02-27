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
  tags_string: "{{ note.tags }}"
  title: "{{ note.title }}"
  # date: "{{ note.created_time }}"
  description: "{{ note.content | twitterExerpt }}"
  thumbnail:  "{{ note | getNoteThumbnail }}"
  created_date: "{{ note.created_time }}"
permalink: "note/{{ note.id }}/"
---

{% anyEmbed note.embed %}

{{ note.content }}

{% for image in note.images %}

{% figure image %}

{% endfor %}
