---
layout: layouts/home.njk
eleventyNavigation:
  key: Notes
  order: 2
pagination:
  data: collections.allNotes
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

{% if note.data.url %}
[{{ note.data.title }}]({{ note.data.url }}) - {{ note.data.createdDate | readableDate }}
{% else %}
{{ note.data.title }} - {{ note.data.createdDate | readableDate }}
{% endif %}

<div>{% set tagslist = note.data.tags %}{% include "tagslist.njk" %}</div>

<br/>

{% if note.data.embed %}{% anyEmbed note.data.embed %}<br/>{% endif %}

{% if note.data.isMastodon %}
{{ note.data.content | safe }}
{% else %}
{{ note._templateContent | safe }}
{% endif %}

{% for image in note.data.images %}

{% if image | isString %}
{% figure image %}
{% else %}
{% figure image.url, "", "", image.alt  %}
{% endif %}

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
