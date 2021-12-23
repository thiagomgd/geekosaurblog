const EMPTY = ``;

const youtube = (id) =>  { 
    return `<div class="video-wrapper">
<iframe src="https://www.youtube-nocookie.com/embed/${id}"
frameborder="0" 
allowfullscreen>
</iframe>
</div>`
}

const reddit = (url) =>  { 
    return `<blockquote class="reddit-card">
<a href="${url}">
r/geekosaur Lounge</a>
from <a href="http://www.reddit.com/r/geekosaur">r/geekosaur</a></blockquote>
<script async src="//embed.redditmedia.com/widgets/platform.js" charset="UTF-8"></script>`
}



module.exports = {
    youtube,
    reddit
}