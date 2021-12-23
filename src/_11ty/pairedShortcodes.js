const EMPTY = ``;

const myembed = (content, props={}) => {
    // TODO: default image?
    const {title, image, url, author, siteName, year, date, tags} = props;

    const metaDataInner = date || tags ? `<ul class="details">
{{ with .Get "author"}}
<li class="author">{{ . }}</li>
{{ end }}
{{ with .Get "date" }}
<li class="date">{{ . }}</li>
{{ end }}
{{ with .Get "tags" }}
<li class="tags">
<ul>
{{ $tags := split . ";" }}
{{ range $tags }}
<li>{{- . -}}</li>
{{ end }}
</ul>
</li>
{{ end }}
</ul>` : EMPTY;

    const siteNameSection = siteName && `<h5 class="myEmbed">${siteName}</h5>`
    const yearText = year && ` (${year})`
    const authorSection = author && `<h5 class="myEmbed">${author}${yearText}</h5>`
    const readMoreSection = url && `<p class="read-more">
<a href='${url}'>Go To Link</a>
</p>`

    return `<div class="blog-card">
<div class="meta">
<div class="photo" style='background-image: url(${image})'></div>
${metaDataInner}
</div>
<div class="description">
<h4 class="myEmbed">${title}</h4>
${siteNameSection}
${authorSection}
<hr>
${content}
${readMoreSection}
</div>
</div>`
}

module.exports = {
    myembed
}