---
layout: layouts/home.njk
eleventyNavigation:
  key: Notes
  order: 2
pagination:
  data: notes
  size: 4
# permalink: /notes/{{ pagination.index }}
---

<section class="content-780">
<h1>Notes</h1>

{% if pagination.href.previous %}
  <a href="{{pagination.href.previous}}">Previous Page</a>
{% endif %}
{% if pagination.href.next %}
  <a href="{{pagination.href.next}}">Next Page</a>
{% endif %}

---- 

{% for note in pagination.items -%}

[{{ note.title }}](/note/{{ note.id }}/) - {{ note.created_time | readableDate }}

{% anyEmbed note.embed %}

{{ note.content | safe }}

{% for image in note.images %}

{% figure image %}

{% endfor %}

<hr/>

{% endfor -%}


</section>