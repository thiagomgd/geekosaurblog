const EMPTY = ``;

const youtube = (id) =>  { 
    return `<div id="asdasdad" class="video-wrapper">
<iframe src="https://www.youtube-nocookie.com/embed/${id}"
frameborder="0" 
allowfullscreen>
</iframe>
</div>
<br/>`
}

module.exports = {
    youtube
}