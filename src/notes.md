---
layout: layouts/home.njk
eleventyNavigation:
  key: Notes
  order: 2
pagination:
  data: collections.notes
  size: 5
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

[{{ note.data.title }}]({{ note.url }}) - {{ note.data.createdDate | readableDate }}

<div>{% set tagslist = note.data.tags %}{% include "tagslist.njk" %}</div>

<br/>

{% if note.data.embed %}{% anyEmbed note.data.embed %}<br/>{% endif %}

{% if note.data.isMastodon %}
{{ note.content | safe }}
{% else %}
{{ note._templateContent | safe }}
{% endif %}

{% for image in note.data.images %}

{% figure image %}

{% endfor %}

<hr/>

{% endfor -%}


{% if pagination.href.previous %}
  <a href="{{pagination.href.previous}}">Previous Page</a>
{% endif %}
{% if pagination.href.next %}
  <a href="{{pagination.href.next}}">Next Page</a>
{% endif %}

</section>
