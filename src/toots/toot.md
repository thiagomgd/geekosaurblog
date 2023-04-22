---
layout: layouts/note.njk
# add tags after changing layout and having a filter for note tags
# tags: ["detail"] 
pagination:
  data: collections.posseToots
  size: 1  
  alias: toot
  # addAllPagesToCollections: true
eleventyComputed:
  dontBridgy: "{{ toot.dontBridgy }}"
  tootUrl: "{{ toot.tootUrl }}"
  tagsString: "{{ toot.tags }}"
  title: "{{ toot.title }}"
  createdTime: "{{ toot.date }}"
  slug: "{{ toot.slug }}"
  permalink: "{{ toot.permalink }}"
  # permalink: "note/{{ toot.slug }}/"
---

{% anyEmbed toot.embed %}

{{ toot.content | safe }}

{% for image in toot.images %}

{% figure image.url, "", "u-photo", image.alt %}

{% endfor %}
