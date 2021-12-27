const markdownIt = require("markdown-it");

const outdent = require("outdent")({ newline: " " });

const EMPTY = ``;

const youtube = (id) => {
  return outdent`<div class="video-wrapper">
<iframe src="https://www.youtube-nocookie.com/embed/${id}"
frameborder="0" 
allowfullscreen>
</iframe>
</div>`;
};

const reddit = (url) => {
  return `<blockquote class="reddit-card">
<a href="${url}">r/geekosaur Lounge</a>
from <a href="http://www.reddit.com/r/geekosaur">r/geekosaur</a></blockquote>
<script async src="//embed.redditmedia.com/widgets/platform.js" charset="UTF-8"></script>`;
};

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// TODO: not finished yet. Needs css
function spoiler(text) {
  const uuid = uuidv4();
  return outdent`<span class="spoilers" title="Click to show spoiler"
onclick="document.getElementById('${uuid}').className = 'spoiler-text spoiler-show';"><span
class="spoiler-alert">(spoilers)</span>
<span id="${uuid}" class="spoiler-text">${text}</span></span>`;
}

const blur = (props = {}) => {
  const { src, caption, alt = "", className = "" } = props;
  const uuid = uuidv4();

  const figureClass = className ? `class="${className}"` : EMPTY;
  // const altVal = alt ? `alt=${alt}` : EMPTY;

  // TODO: markdownify
  // {{ with (.Get "title") -}}
  // <h4>{{ . }}</h4>
  // {{- end -}}
  // {{- if or (.Get "caption") (.Get "attr") -}}<p>
  //     {{- .Get "caption" | markdownify -}}
  //     {{- with .Get "attrlink" }}
  //     <a href="{{ . }}">
  //         {{- end -}}
  //         {{- .Get "attr" | markdownify -}}
  //         {{- if .Get "attrlink" }}</a>{{ end }}</p>
  // {{- end }}
  const captionTag = caption ? `<figcaption>${caption}</figcaption>` : EMPTY;

  // TODO: style/width/height?
  const imgTag = `<img src="${src}" alt="${alt}"/>`;

  return outdent`<div class="blurDiv blurred" id="${uuid}" >
<figure ${figureClass} onclick="document.getElementById('${uuid}').className = 'blurDiv';">
    ${imgTag}
    ${captionTag}    
</figure>
</div>`;
};

function card(title, img, rating, review_link) {

  const badge = rating ? `<div class="card-badge">${rating}</div>` : EMPTY;
  const imgTag = img ? `<div class="card-image-div"><img src="${img}"/></div>` : EMPTY;
  const reviewTag = review_link ? `<p><a href="${review_link}">Review</a></p>` : EMPTY;
  // const contentDiv = content ? `<div class="card-content"> ${markdownIt.render(content)} </div>` : EMPTY;

  return `<div class="card">
${badge}  
${imgTag}
<div class="card-content">
<p class="card-title">${title}</p>
${reviewTag}
</div>
</div>`;
}

module.exports = {
  youtube,
  reddit,
  blur,
  card,
  figure: (image, caption, className, alt="") => {
    const mdCaption = markdownIt().renderInline(caption);
    const classMarkup = className ? ` class="${className}"` : '';
    const captionMarkup = caption ? `<figcaption>${mdCaption}</figcaption>` : '';
    return `<figure${classMarkup}><img src="${image}" alt="${alt}" />${captionMarkup}</figure>`;
  }
};

