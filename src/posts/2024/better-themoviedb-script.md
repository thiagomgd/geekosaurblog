---
tags:
  - script
date: 2024-02-05T13:30:00
title: better-themoviedb-script
description: "A while ago I moved from Trakt.tv to TheMovieDB.org. While I love it, there are a few things it could be better. So I though: why not a script?"
lead: 
thumbnail: 
slug: better-themoviedb-script
---
A while ago, I decided to move away from Trakt.tv, and found a new home on themoviedb. While I love TMDB, there are a few things missing that bothered me, and I decided to use ViolentMonkey to create a user script and make a some improvements so my experience is better.

The script is available on [this gist](https://gist.github.com/thiagomgd/ddc36493dc934490fe3f4949e827e4bb) and for now, still being updated from time to time.
## Actor Page

Starting from the actor's page, I made a few changes to help me have some insights, and add items to my watchlist:

- Indicate which movies/shows I added to a list
- Indicate which movies/shows I rated
- Indicate how many are on my watchlist, other lists, and rated
- Indicate actors I like/follow (this is a hack for now)
- Average rating (my ratings)
- Indicate when original language is not EN, and when it's flagged as adult
- Indicate popularity and rating for each item
- Show poster

We shouldn't just a book by it's cover, but having the posters there definitely helps me. And also of course, the rating!

![[Pasted image 20240131164333.png]]

Rated and Watchlisted items have a different icon, and also a different background. Background is also blue if it's on any list. Rating and Popularity are global, not my rating.

![[Pasted image 20240131164823.png]]

## Media Page

Added text to Indicate if the show/movie is on a list by showing the list names, and changing the Add To List icon. 

![[Pasted image 20240131191219.png]]

Also added a button to load public lists that contain the show/movie. Clicking on the button will move to the next page of results (movies only for now)
## Search Page

Highlight items that are in a list, and append list names and rating to title. Will also add watchlist indicator later on.

![[Pasted image 20240205092933.png]]
## List Page

I missed having some information and filter on my lists' pages. I added the total number of rated items (only works on my own lists), and also some filters to only show items that are rated/unrated, and also media flagged as adult.

![[Pasted image 20240205092015.png]]