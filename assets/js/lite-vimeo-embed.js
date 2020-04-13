/**
 * Add a <link rel={preload | preconnect} ...> to the head
 */
function addPrefetch(kind, url, as) {
    const linkElem = document.createElement('link');
    linkElem.rel = kind;
    linkElem.href = url;
    if (as) {
        linkElem.as = as;
    }
    linkElem.crossorigin = true;
    document.head.appendChild(linkElem);
}

function canUseWebP() {
    var elem = document.createElement('canvas');

    if (elem.getContext && elem.getContext('2d')) {
        // was able or not to get WebP representation
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    // very old browser like IE 8, canvas not supported
    return false;
}

/**
 * Get the thumbnail dimensions to use for a given player size.
 *
 * @param {Object} options
 * @param {number} options.width The width of the player
 * @param {number} options.height The height of the player
 * @return {Object} The width and height
 */
function getThumbnailDimensions({ width, height }) {
    let roundedWidth = width;
    let roundedHeight = height;

    // If the original width is a multiple of 320 then we should
    // not round up. This is to keep the native image dimensions
    // so that they match up with the actual frames from the video.
    //
    // For example 640x360, 960x540, 1280x720, 1920x1080
    //
    // Round up to nearest 100 px to improve cacheability at the
    // CDN. For example, any width between 601 pixels and 699
    // pixels will render the thumbnail at 700 pixels width.
    if (roundedWidth % 320 !== 0) {
        roundedWidth = Math.ceil(width / 100) * 100;
        roundedHeight = Math.round((roundedWidth / width) * height);
    }

    return {
        width: roundedWidth,
        height: roundedHeight
    };
}

/**
 * Ported from https://github.com/paulirish/lite-youtube-embed
 *
 * A lightweight vimeo embed. Still should feel the same to the user, just MUCH faster to initialize and paint.
 *
 * Thx to these as the inspiration
 *   https://storage.googleapis.com/amp-vs-non-amp/youtube-lazy.html
 *   https://autoplay-youtube-player.glitch.me/
 *
 * Once built it, I also found these:
 *   https://github.com/ampproject/amphtml/blob/master/extensions/amp-youtube (👍👍)
 *   https://github.com/Daugilas/lazyYT
 *   https://github.com/vb/lazyframe
 */
class LiteVimeo extends HTMLElement {
    constructor() {
        super();
        // TODO: support dynamically setting the attribute via attributeChangedCallback
    }

    connectedCallback() {
        // Gotta encode the untrusted value
        // https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-2---attribute-escape-before-inserting-untrusted-data-into-html-common-attributes
        this.videoId = encodeURIComponent(this.getAttribute('videoid'));

        /**
         * Lo, the vimeo placeholder image!  (aka the thumbnail, poster image, etc)
         * We have to use the Vimeo API.
         */
        let { width, height } = getThumbnailDimensions(this.getBoundingClientRect());
        const devicePixelRatio = window.devicePixelRatio || 1;
        width *= devicePixelRatio;
        height *= devicePixelRatio;

        let thumbnailUrl = `https://lite-vimeo-embed.now.sh/thumb/${this.videoId}`;
        thumbnailUrl += `.${canUseWebP() ? 'webp' : 'jpg'}`;
        thumbnailUrl += `?mw=${width}&mh=${height}&q=${devicePixelRatio > 1 ? 70 : 85}`;

        this.style.backgroundImage = `url("${thumbnailUrl}")`;

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.classList.add('ltv-playbtn');
        this.appendChild(playBtn);

        // On hover (or tap), warm up the TCP connections we're (likely) about to use.
        this.addEventListener('pointerover', LiteVimeo._warmConnections, {
            once: true
        });

        // Once the user clicks, add the real iframe and drop our play button
        // TODO: In the future we could be like amp-youtube and silently swap in the iframe during idle time
        //   We'd want to only do this for in-viewport or near-viewport ones: https://github.com/ampproject/amphtml/pull/5003
        this.addEventListener('click', () => this._addIframe());
    }

    // // TODO: Support the the user changing the [videoid] attribute
    // attributeChangedCallback() {
    // }

    /**
     * Begin pre-connecting to warm up the iframe load
     * Since the embed's network requests load within its iframe,
     *   preload/prefetch'ing them outside the iframe will only cause double-downloads.
     * So, the best we can do is warm up a few connections to origins that are in the critical path.
     *
     * Maybe `<link rel=preload as=document>` would work, but it's unsupported: http://crbug.com/593267
     * But TBH, I don't think it'll happen soon with Site Isolation and split caches adding serious complexity.
     */
    static _warmConnections() {
        if (LiteVimeo.preconnected) return;

        // The iframe document and most of its subresources come right off player.vimeo.com
        addPrefetch('preconnect', 'https://player.vimeo.com');
        // Images
        addPrefetch('preconnect', 'https://i.vimeocdn.com');
        // Files .js, .css
        addPrefetch('preconnect', 'https://f.vimeocdn.com');
        // Metrics
        addPrefetch('preconnect', 'https://fresnel.vimeocdn.com');

        LiteVimeo.preconnected = true;
    }

    _addIframe() {
        const iframeHTML = `
<iframe width="640" height="360" frameborder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen
  src="https://player.vimeo.com/video/${this.videoId}?autoplay=1"
></iframe>`;
        this.insertAdjacentHTML('beforeend', iframeHTML);
        this.classList.add('ltv-activated');
    }
}
// Register custome element
customElements.define('lite-vimeo', LiteVimeo);
