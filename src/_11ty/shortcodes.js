module.exports = {
    youtube: (id) =>  { 
return ` 
<div class="video-wrapper">
<iframe src="https://www.youtube-nocookie.com/embed/${id}"
frameborder="0" 
allowfullscreen>
</iframe>
</div>`}
}