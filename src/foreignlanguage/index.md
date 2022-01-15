---
layout: layouts/post.njk
date: "2021-04-20"
title: Foreign Language Movies & TV
templateClass: tmpl-post
permalink: /foreign-language-movies-tv/
reddit: https://www.reddit.com/r/geekosaur/comments/mujrkk/foreing_language_movies_shows/
tweetId: "1384383047475228675"
eleventyNavigation:
  key: Foreign Language Movies & TV
  order: 3
---

In the post [Which Foreign Language Shows And Movies Do You Like?](/post/nonenglish-shows-movies/), I started a series of posts featuring non-English (and non-Asian) movies & shows. The main reason for that is that most of this blog's audience is familiar with entertainment in English, as well as asian dramas and movies.

From the list below I'm also excluding Brazilian shows, as until now, it's only stuff that I watched when I was still living in Brazil, so it kind of doesn't count for me. But if/when I watch new Brazilian content on Netflix, I'll add it here as well.

The ones that have a link will take you to my review (or first impressions) post. `Status` as `Waiting` means I'm waiting for a new season to be released, or be made available in Canada, which is the case of The Ministry of Time.

## Non-Asian

| Name                                        | Country | Type  | Year | Status    | Trakt Link |
| ------------------------------------------- | ------- | ----- | ---- | --------- | ------------- |
{% for thing in foreignMedia.started.other -%}
| {% if thing.review %}[{{ thing.name }}]({{ thing.review }}){% else %}{{ thing.name }}{% endif %} | {{ thing.country }} | {{ thing.type }} | {{ thing.year }} | {{ thing.status }} | [link]({{ thing.link }}) |
{% endfor -%}


## Asian

| Name                                        | Country | Type  | Year | Status    | Trakt Link |
| ------------------------------------------- | ------- | ----- | ---- | --------- | ------------- |
{% for thing in foreignMedia.started.asian -%}
| {% if thing.review %}[{{ thing.name }}]({{ thing.review }}){% else %}{{ thing.name }}{% endif %} | {{ thing.country }} | {{ thing.type }} | {{ thing.year }} | {{ thing.status }} | [link]({{ thing.link }}) |
{% endfor -%}
