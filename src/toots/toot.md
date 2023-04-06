---
layout: layouts/note.njk
# add tags after changing layout and having a filter for note tags
# tags: ["detail"] 
pagination:
  data: mytoots
  size: 1  
  alias: toot
  addAllPagesToCollections: true
eleventyComputed:
  tagsString: "{{ toot.tags }}"
  title: "{{ toot.title }}"
  tootUrl: "{{ toot.url }}"
  createdTime: "{{ toot.date }}"
  permalink: "note/{{ toot.slug }}/"
---

{% anyEmbed toot.embed %}

{{ toot.content | safe }}

{% for image in toot.images %}

{% figure image.url, "", "u-photo", image.alt %}

{% endfor %}
