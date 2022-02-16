const markdownIt = require("markdown-it");
const outdent = require("outdent")({ newline: " " });

const { getLocalImageLink } = require("../_11ty/helpers");

const EMPTY = ``;

const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt) {
  if(alt === undefined) {
    // You bet we throw an error on missing alt (alt="" works okay)
    throw new Error(`Missing \`alt\` on myImage from: ${src}`);
  }

  const fileSource = src.startsWith('/img') ? `./src${src}` : src;
  console.log(fileSource);
  let metadata = await Image(fileSource, {
    widths: [800],
    outputDir: '_site/img',
  });

  let data = metadata.jpeg[metadata.jpeg.length - 1];
  return `<img src="${data.url}" width="${data.width}" height="${data.height}" alt="${alt}" loading="lazy" decoding="async">`;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const blur = async (src, caption, className="", alt="") => {
  const localSrc = getLocalImageLink(src);
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
  const imgTag = await imageShortcode(localSrc, alt); // `<img src="${localSrc}" alt="${alt}"/>`;

  return outdent`<div class="blurDiv blurred" id="${uuid}" >
<figure ${figureClass} onclick="document.getElementById('${uuid}').className = 'blurDiv';">
    ${imgTag}
    ${captionTag}    
</figure>
</div>`;
};

async function card(title, img, rating, review_link, goodreads) {
  const localImg = getLocalImageLink(img);

  const badge = rating ? `<div class="card-badge">${rating}</div>` : EMPTY;
  const imgTag = localImg ? `<div class="card-image-div"><img src="${localImg}"/></div>` : EMPTY;
  const reviewTag = review_link ? `<p><a href="${review_link}">Review</a></p>` : EMPTY;
  // todo: extract domain and use as link text
  const goodreadsTag = goodreads ? `<p><a href="${goodreads}" target="_blank" rel="noopener noreferrer">Goodreads</a></p>` : EMPTY;

  return `<div class="card">
${badge}  
${imgTag}
<div class="card-content">
<p class="card-title">${title}</p>
${reviewTag} 
${goodreadsTag}
</div>
</div>`;
}

module.exports = {
  blur,
  card,
  figure: async (image, caption="", className="", alt="") => {
    const localSrc = getLocalImageLink(image);

    const mdCaption = caption ? markdownIt().renderInline(caption) : EMPTY;
    const classMarkup = className ? ` class="${className}"` : '';
    const captionMarkup = caption ? `<figcaption>${mdCaption}</figcaption>` : '';
    const imgTag = await imageShortcode(localSrc, alt);
    return `<figure${classMarkup}>${imgTag}${captionMarkup}</figure>`;
  }
};

