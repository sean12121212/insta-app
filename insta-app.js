/**
 * Copyright 2026 Sean Frey
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";

/**
 * `insta-app`
 * Instagram-style photo card gallery that fetches NFL player data from images.json
 * Supports lazy loading, likes, sharing, and prev/next navigation
 *
 * @demo index.html
 * @element insta-app
 */
export class InstaApp extends DDDSuper(I18NMixin(LitElement)) {

  /**
   * Defines the custom element tag name
   */
  static get tag() {
    return "insta-app";
  }

  /**
   * Constructor sets default values
   */
  constructor() {
    super();
    this.images         = [];
    this.author         = {};
    this.activeIndex    = 0;
    this.loading        = false;
    this.elementVisible = false;
    this.t = this.t || {};
    this.t = {
      ...this.t,
      title: "Title",
    };
    this.registerLocalization({
      context: this,
      localesPath:
        new URL("./locales/insta-app.ar.json", import.meta.url).href +
        "/../",
    });
  }

  /**
   * Reactive properties
   * images — array of player objects loaded from images.json
   * author — single author object from images.json
   * activeIndex — tracks which player card is currently displayed
   * loading — true while fetch is in progress
   * elementVisible — controlled by IntersectionObserver for lazy loading
   */
  static get properties() {
    return {
      ...super.properties,
      images:         { type: Array },
      author:         { type: Object },
      activeIndex:    { type: Number },
      loading:        { type: Boolean },
      elementVisible: { type: Boolean },
    };
  }

  /**
   * Styles
   * Scoped CSS using DDD design system tokens
   * Covers card layout, header, image area, action bar, caption, nav overlays
   * Includes shimmer loading skeleton, like animation, dark/light mode, and responsive breakpoints
   */
  static get styles() {
    return [
      super.styles,
      css`
        /* ── host ───────────────────────────────────── */
        :host {
          display: block;
          font-family: var(--ddd-font-navigation);
        }

        /* ── placeholder shown before element is visible ── */
        .placeholder {
          background:    var(--ddd-theme-default-potentialMidnight);
          border:        var(--ddd-border-sm) solid var(--ddd-theme-default-navy70);
          border-radius: var(--ddd-radius-lg);
          max-width:     420px;
          margin:        0 auto;
          aspect-ratio:  3 / 4;
          min-height:    520px;
        }

        /* ── card shell ─────────────────────────────── */
        .card {
          background:    var(--ddd-theme-default-potentialMidnight);
          border:        var(--ddd-border-sm) solid var(--ddd-theme-default-navy70);
          border-radius: var(--ddd-radius-lg);
          max-width:     420px;
          margin:        0 auto;
          overflow:      hidden;
          box-shadow:    var(--ddd-boxShadow-lg);
          transition:    box-shadow 0.3s ease;
        }
        .card:hover {
          box-shadow: var(--ddd-boxShadow-xl);
        }

        /* ── header ─────────────────────────────────── */
        .card-header {
          display:       flex;
          align-items:   center;
          gap:           var(--ddd-spacing-3);
          padding:       var(--ddd-spacing-3) var(--ddd-spacing-4);
          border-bottom: var(--ddd-border-sm) solid var(--ddd-theme-default-navy70);
        }

        .avatar {
          width:           var(--ddd-spacing-10);
          height:          var(--ddd-spacing-10);
          border-radius:   var(--ddd-radius-circle);
          flex-shrink:     0;
          background:      linear-gradient(
            135deg,
            var(--ddd-theme-default-roarGolden),
            var(--ddd-theme-default-landgrantBrown)
          );
          display:         flex;
          align-items:     center;
          justify-content: center;
          font-size:       var(--ddd-font-size-m);
          font-weight:     var(--ddd-font-weight-bold);
          color:           var(--ddd-theme-default-potentialMidnight);
        }

        .header-text {
          display:        flex;
          flex-direction: column;
          gap:            var(--ddd-spacing-1);
          flex:           1;
        }

        .username {
          font-size:      var(--ddd-font-size-s);
          font-weight:    var(--ddd-font-weight-bold);
          color:          var(--ddd-theme-default-slateMaxLight);
          letter-spacing: 0.03em;
        }

        .channel {
          font-size:  var(--ddd-font-size-4xs);
          color:      var(--ddd-theme-default-slateGray);
          font-style: italic;
        }

        .refresh-btn {
          background:    none;
          border:        none;
          color:         var(--ddd-theme-default-slateGray);
          font-size:     var(--ddd-font-size-m);
          cursor:        pointer;
          line-height:   1;
          padding:       var(--ddd-spacing-1);
          border-radius: var(--ddd-radius-sm);
          transition:    color 0.2s, transform 0.35s;
        }
        .refresh-btn:hover {
          color:     var(--ddd-theme-default-roarGolden);
          transform: rotate(180deg);
        }

        /* ── image area ─────────────────────────────── */
        .image-wrap {
          position:   relative;
          width:      100%;
          background: var(--ddd-theme-default-potential0);
          overflow:   hidden;
        }

        .player-img {
          width:      100%;
          height:     auto;
          display:    block;
          object-fit: contain;
          opacity:    0;
          transition: opacity 0.35s ease, transform 0.4s ease;
        }
        .player-img.loaded {
          opacity: 1;
        }
        .player-img:hover {
          transform: scale(1.03);
        }

        /* shimmer skeleton shown while image is loading */
        .shimmer {
          position:        absolute;
          inset:           0;
          background:      linear-gradient(
            90deg,
            var(--ddd-theme-default-potential0)  25%,
            var(--ddd-theme-default-navy80)       50%,
            var(--ddd-theme-default-potential0)   75%
          );
          background-size: 200% 100%;
          animation:       shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── action bar ─────────────────────────────── */
        .actions {
          display:     flex;
          align-items: center;
          gap:         var(--ddd-spacing-4);
          padding:     var(--ddd-spacing-3) var(--ddd-spacing-4) var(--ddd-spacing-2);
        }

        .action-btn {
          background:  none;
          border:      none;
          cursor:      pointer;
          padding:     0;
          display:     flex;
          align-items: center;
          color:       var(--ddd-theme-default-slateGray);
          font-family: inherit;
          transition:  color 0.2s ease, transform 0.15s ease;
        }
        .action-btn:hover {
          color:     var(--ddd-theme-default-slateMaxLight);
          transform: scale(1.1);
        }
        .action-btn svg {
          width:           24px;
          height:          24px;
          stroke:          currentColor;
          fill:            none;
          stroke-width:    1.8;
          stroke-linecap:  round;
          stroke-linejoin: round;
        }

        /* like button turns gold and fills when active */
        .like-btn.liked {
          color: var(--ddd-theme-default-roarGolden);
        }
        .like-btn.liked svg {
          fill:   var(--ddd-theme-default-roarGolden);
          stroke: var(--ddd-theme-default-roarGolden);
        }
        .like-btn.pop {
          animation: pop 0.25s ease;
        }
        @keyframes pop {
          0%   { transform: scale(1);   }
          50%  { transform: scale(1.4); }
          100% { transform: scale(1);   }
        }

        .spacer { flex: 1; }

        /* ── prev/next nav arrows overlaid on image ─── */
        .nav-prev,
        .nav-next {
          position:        absolute;
          top:             50%;
          transform:       translateY(-50%);
          background:      rgba(0,0,0,0.45);
          border:          none;
          color:           var(--ddd-theme-default-slateMaxLight);
          width:           36px;
          height:          36px;
          border-radius:   var(--ddd-radius-circle);
          display:         flex;
          align-items:     center;
          justify-content: center;
          cursor:          pointer;
          font-size:       var(--ddd-font-size-m);
          transition:      background 0.2s, opacity 0.2s;
          z-index:         2;
        }
        .nav-prev { left: var(--ddd-spacing-2); }
        .nav-next { right: var(--ddd-spacing-2); }
        .nav-prev:hover:not(:disabled),
        .nav-next:hover:not(:disabled) {
          background: rgba(0,0,0,0.75);
        }
        .nav-prev:disabled,
        .nav-next:disabled {
          opacity: 0.2;
          cursor:  not-allowed;
        }

        /* slide counter pill floating at bottom center of image */
        .nav-counter {
          position:       absolute;
          bottom:         var(--ddd-spacing-2);
          left:           50%;
          transform:      translateX(-50%);
          background:     rgba(0,0,0,0.5);
          color:          var(--ddd-theme-default-slateMaxLight);
          font-size:      var(--ddd-font-size-4xs);
          padding:        var(--ddd-spacing-1) var(--ddd-spacing-2);
          border-radius:  var(--ddd-radius-sm);
          letter-spacing: 0.05em;
          z-index:        2;
        }

        /* ── caption ─────────────────────────────────── */
        .caption {
          padding: var(--ddd-spacing-2) var(--ddd-spacing-4) var(--ddd-spacing-4);
        }

        .player-name {
          font-size:     var(--ddd-font-size-m);
          font-weight:   var(--ddd-font-weight-bold);
          color:         var(--ddd-theme-default-roarGolden);
          margin-bottom: var(--ddd-spacing-1);
        }

        .caption-text {
          font-size:     var(--ddd-font-size-s);
          color:         var(--ddd-theme-default-slateLight);
          line-height:   1.55;
          margin-bottom: var(--ddd-spacing-2);
        }

        .timestamp {
          font-size:      var(--ddd-font-size-4xs);
          color:          var(--ddd-theme-default-slateGray);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-top:     var(--ddd-spacing-2);
        }

        /* error state */
        .error-state {
          padding:    var(--ddd-spacing-10) var(--ddd-spacing-4);
          text-align: center;
          color:      var(--ddd-theme-default-slateGray);
          font-size:  var(--ddd-font-size-s);
        }
        .error-btn {
          margin-top:    var(--ddd-spacing-3);
          background:    none;
          border:        var(--ddd-border-sm) solid var(--ddd-theme-default-roarGolden);
          color:         var(--ddd-theme-default-roarGolden);
          padding:       var(--ddd-spacing-2) var(--ddd-spacing-4);
          border-radius: var(--ddd-radius-sm);
          cursor:        pointer;
          font-family:   inherit;
          font-size:     var(--ddd-font-size-4xs);
          transition:    background 0.2s;
        }
        .error-btn:hover {
          background: var(--ddd-theme-default-potential50);
        }

        /*responsive */
        @media (max-width: 480px) {
          .card,
          .placeholder {
            border-radius: var(--ddd-radius-0);
            max-width:     100%;
          }
        }

        /*light mode override*/
        @media (prefers-color-scheme: light) {
          .card,
          .placeholder {
            background:   var(--ddd-theme-default-slateMaxLight);
            border-color: var(--ddd-theme-default-limestoneGray);
          }
          .card-header {
            border-color: var(--ddd-theme-default-limestoneGray);
          }
          .username {
            color: var(--ddd-theme-default-potentialMidnight);
          }
          .caption-text {
            color: var(--ddd-theme-default-coalyGray);
          }
        }
      `,
    ];
  }

  /**
   * Lifecycle — runs when element is added to the DOM
   * Sets up the IntersectionObserver for lazy loading
   */
  connectedCallback() {
    super.connectedCallback();
    this._setupIntersectionObserver();
  }

  /**
   * Lifecycle — runs when element is removed from the DOM
   * Cleans up the IntersectionObserver to avoid memory leaks
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  /**
   * Sets up an IntersectionObserver on the host element
   * 
   */
  _setupIntersectionObserver() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.elementVisible) {
            this.elementVisible = true;
            this._fetchData();
            this._observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px",
        threshold:  0.1,
      }
    );
    this._observer.observe(this);
  }

  /**
   * Fetches player and author data from images.json
   * Sets this.author and this.images from the response
   * Sets loading state during the request
   */
  async _fetchData() {
    this.loading = true;
    try {
      const res = await fetch("./images.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.author = data.author;
      this.images = data.images;
    } catch (err) {
      console.warn("[insta-app] fetch failed:", err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Moves to the previous player card
   * Only runs if activeIndex is greater than 0
   */
  _prev() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  /**
   * Moves to the next player card
   * Only runs if activeIndex is less than the last index
   */
  _next() {
    if (this.activeIndex < this.images.length - 1) {
      this.activeIndex++;
    }
  }

  /**
   * Toggles the liked state on the current player
   * Spreads the images array to trigger Lit reactivity
   * Triggers the pop animation on the like button
   */
  _toggleLike() {
    const player = this.images[this.activeIndex];
    if (!player) return;
    player.liked = !player.liked;
    this.images = [...this.images];

    const btn = this.shadowRoot?.querySelector(".like-btn");
    if (btn) {
      btn.classList.remove("pop");
      void btn.offsetWidth;
      btn.classList.add("pop");
    }
  }

  /**
   * Adds the loaded class to the image once it finishes loading
   * Triggers the fade-in transition
   */
  _onImgLoad(e) {
    e.target.classList.add("loaded");
  }

  /**
   * Shares the current player's image URL
   * Uses the Web Share API if available, otherwise copies to clipboard
   */
  _share() {
    const player = this.images[this.activeIndex];
    if (!player) return;
    const shareUrl = player.src;
    if (navigator.share) {
      navigator.share({ url: shareUrl, title: player.name });
    } else {
      navigator.clipboard?.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  }

  /**
   * Render
   * 
   */
  render() {
    if (!this.elementVisible) {
      return html`<div class="placeholder"></div>`;
    }

    if (this.loading) {
      return html`
        <div class="card">
          <div class="image-wrap">
            <div class="shimmer"></div>
          </div>
        </div>
      `;
    }

    if (!this.images || this.images.length === 0) {
      return html`
        <div class="card">
          <div class="error-state">
            <div>Could not load players</div>
            <button class="error-btn" @click=${this._fetchData}>
              Try again
            </button>
          </div>
        </div>
      `;
    }

    const player = this.images[this.activeIndex];

    return html`
      <div class="card">

        <!-- header pulls author name and channel from JSON -->
        <div class="card-header">
          <div class="avatar">S</div>
          <div class="header-text">
            <span class="username">${this.author.name}</span>
            <span class="channel">${this.author.channel}</span>
          </div>
          <button
            class="refresh-btn"
            @click=${this._fetchData}
            title="Reload"
            aria-label="Reload data">↻</button>
        </div>

        <!-- image with prev/next arrows and slide counter overlaid -->
        <div class="image-wrap">
          <button
            class="nav-prev"
            @click=${this._prev}
            ?disabled=${this.activeIndex === 0}
            aria-label="Previous">‹</button>

          <img
            class="player-img"
            src=${player.src}
            alt=${player.name}
            @load=${this._onImgLoad}
          />

          <button
            class="nav-next"
            @click=${this._next}
            ?disabled=${this.activeIndex === this.images.length - 1}
            aria-label="Next">›</button>

          <span class="nav-counter">
            ${this.activeIndex + 1} / ${this.images.length}
          </span>
        </div>

        <!-- like, share, and save action buttons -->
        <div class="actions">

          <button
            class="action-btn like-btn ${player.liked ? "liked" : ""}"
            @click=${this._toggleLike}
            aria-label="${player.liked ? "Unlike" : "Like"}">
            <svg viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67
                       l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06
                       L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          <button
            class="action-btn"
            @click=${this._share}
            aria-label="Share">
            <svg viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>

          <div class="spacer"></div>

          <button class="action-btn" aria-label="Save">
            <svg viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

        </div>

        <!-- caption shows player name, description, and date from JSON -->
        <div class="caption">
          <div class="player-name">${player.name}</div>
          <div class="caption-text">${player.description}</div>
          <div class="timestamp">${player.dateTaken}</div>
        </div>

      </div>
    `;
  }

  /**
   * HAX integration
   */
  static get haxProperties() {
    return new URL(`./lib/${this.tag}.haxProperties.json`, import.meta.url).href;
  }
}

globalThis.customElements.define(InstaApp.tag, InstaApp);