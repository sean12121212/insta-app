/**
 * Copyright 2026 Sean Frey
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";

/**
 * `insta-app`
 * Instagram-style photo card that lazily fetches from randomfox.ca
 *
 * @demo index.html
 * @element insta-app
 */
export class InstaApp extends DDDSuper(I18NMixin(LitElement)) {

  static get tag() {
    return "insta-app";
  }

  constructor() {
    super();
    this.foxImage      = "";
    this.foxLink       = "";
    this.loading       = false;
    this.liked         = false;
    this.elementVisible = false;   // controlled by IntersectionObserver
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

  static get properties() {
    return {
      ...super.properties,
      foxImage:       { type: String },
      foxLink:        { type: String },
      loading:        { type: Boolean },
      liked:          { type: Boolean },
      elementVisible: { type: Boolean },
    };
  }

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
          background:      linear-gradient(
            135deg,
            var(--ddd-theme-default-roarGolden),
            var(--ddd-theme-default-landgrantBrown)
          );
          display:         flex;
          align-items:     center;
          justify-content: center;
          font-size:       var(--ddd-font-size-s);
          flex-shrink:     0;
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

        .location {
          font-size:  var(--ddd-font-size-4xs);
          color:      var(--ddd-theme-default-slateGray);
          font-style: italic;
        }

        .refresh-btn {
          background:  none;
          border:      none;
          color:       var(--ddd-theme-default-slateGray);
          font-size:   var(--ddd-font-size-m);
          cursor:      pointer;
          line-height: 1;
          padding:     var(--ddd-spacing-1);
          border-radius: var(--ddd-radius-sm);
          transition:  color 0.2s, transform 0.35s;
        }
        .refresh-btn:hover {
          color:     var(--ddd-theme-default-roarGolden);
          transform: rotate(180deg);
        }

        /* ── image area ─────────────────────────────── */
        .image-wrap {
          position:     relative;
          width:        100%;
          aspect-ratio: 1 / 1;
          background:   var(--ddd-theme-default-potential0);
          overflow:     hidden;
        }

        .fox-img {
          width:      100%;
          height:     100%;
          object-fit: cover;
          display:    block;
          opacity:    0;
          transition: opacity 0.35s ease, transform 0.4s ease;
        }
        .fox-img.loaded {
          opacity: 1;
        }
        .fox-img:hover {
          transform: scale(1.03);
        }

        /* shimmer skeleton */
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

        /* like states */
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
          0%   { transform: scale(1);    }
          50%  { transform: scale(1.4);  }
          100% { transform: scale(1);    }
        }

        .spacer { flex: 1; }

        /* ── caption ─────────────────────────────────── */
        .caption {
          padding: 0 var(--ddd-spacing-4) var(--ddd-spacing-4);
        }

        .caption-text {
          font-size:     var(--ddd-font-size-s);
          color:         var(--ddd-theme-default-slateLight);
          line-height:   1.55;
          margin-bottom: var(--ddd-spacing-2);
        }

        .caption-text strong {
          color:        var(--ddd-theme-default-roarGolden);
          margin-right: var(--ddd-spacing-1);
        }

        .timestamp {
          font-size:      var(--ddd-font-size-4xs);
          color:          var(--ddd-theme-default-slateGray);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── source link ─────────────────────────────── */
        .source-link {
          display:         block;
          text-align:      center;
          padding:         var(--ddd-spacing-3) var(--ddd-spacing-4);
          border-top:      var(--ddd-border-sm) solid var(--ddd-theme-default-navy70);
          font-size:       var(--ddd-font-size-4xs);
          color:           var(--ddd-theme-default-navy40);
          text-decoration: none;
          letter-spacing:  0.1em;
          text-transform:  uppercase;
          transition:      color 0.2s, background 0.2s;
        }
        .source-link:hover {
          color:      var(--ddd-theme-default-roarGolden);
          background: var(--ddd-theme-default-potential50);
        }

        /* ── error state ────────────────────────────── */
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

        /* ── responsive ─────────────────────────────── */
        @media (max-width: 480px) {
          .card,
          .placeholder {
            border-radius: var(--ddd-radius-0);
            max-width:     100%;
          }
        }

        /* ── light mode override ────────────────────── */
        @media (prefers-color-scheme: light) {
          .card,
          .placeholder {
            background:  var(--ddd-theme-default-slateMaxLight);
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
          .source-link {
            border-color: var(--ddd-theme-default-limestoneGray);
            color:        var(--ddd-theme-default-slateGray);
          }
          .source-link:hover {
            background: var(--ddd-theme-default-limestoneLight);
          }
        }
      `,
    ];
  }

  // ── lifecycle ──────────────────────────────────────

  connectedCallback() {
    super.connectedCallback();
    this._setupIntersectionObserver();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  // ── IntersectionObserver lazy load ─────────────────

  _setupIntersectionObserver() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.elementVisible) {
            this.elementVisible = true;
            this._fetchFox();
            // once visible and loaded, no need to keep observing
            this._observer.disconnect();
          }
        });
      },
      {
        // start loading slightly before fully in view
        rootMargin: "100px",
        threshold:  0.1,
      }
    );

    // observe the host element itself
    this._observer.observe(this);
  }

  // ── data fetch ─────────────────────────────────────

  async _fetchFox() {
    this.loading  = true;
    this.foxImage = "";
    this.foxLink  = "";
    try {
      const res = await fetch("https://randomfox.ca/floof/");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.foxImage = data.image;
      this.foxLink  = data.link;
    } catch (err) {
      console.warn("[insta-app] fetch failed:", err);
    } finally {
      this.loading = false;
    }
  }

  // ── event handlers ─────────────────────────────────

  _toggleLike() {
    this.liked = !this.liked;
    const btn = this.shadowRoot?.querySelector(".like-btn");
    if (btn) {
      btn.classList.remove("pop");
      void btn.offsetWidth;     // force reflow to restart animation
      btn.classList.add("pop");
    }
  }

  _onImgLoad(e) {
    e.target.classList.add("loaded");
  }

  _onRefresh() {
    this._fetchFox();
  }

  _share() {
    if (!this.foxLink) return;
    if (navigator.share) {
      navigator.share({ url: this.foxLink, title: "Check out this fox!" });
    } else {
      navigator.clipboard?.writeText(this.foxLink);
      alert("Link copied to clipboard!");
    }
  }

  // ── render ─────────────────────────────────────────

  render() {
    // KEY: if not yet visible, render nothing but a sized placeholder
    // so the IntersectionObserver has something to observe and the
    // layout doesn't collapse when the card eventually loads
    if (!this.elementVisible) {
      return html`<div class="placeholder"></div>`;
    }

    return html`
      <div class="card">

        <!-- header -->
        <div class="card-header">
          <div class="avatar">F</div>
          <div class="header-text">
            <span class="username">Fox</span>
            <span class="location">Home of the Fox</span>
          </div>
          <button
            class="refresh-btn"
            @click=${this._onRefresh}
            title="Load a new fox"
            aria-label="Refresh fox">↻</button>
        </div>

        <!-- Image -->
        <div class="image-wrap">
          ${this.loading
            ? html`<div class="shimmer"></div>`
            : this.foxImage
              ? html`
                  <img
                    class="fox-img"
                    src=${this.foxImage}
                    alt="A random fox"
                    @load=${this._onImgLoad}
                  />
                `
              : html`
                  <div class="error-state">
                    <div>Could not load fox 🦊</div>
                    <button class="error-btn" @click=${this._onRefresh}>
                      Try again
                    </button>
                  </div>
                `
          }
        </div>

        <!-- action bar -->
        <div class="actions">

          <button
            class="action-btn like-btn ${this.liked ? "liked" : ""}"
            @click=${this._toggleLike}
            aria-label="${this.liked ? "Unlike" : "Like"}">
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

        <!-- caption -->
        <div class="caption">
          <div class="caption-text">
            <strong>Fox</strong>
            This is a fox, :)
          </div>
          <div class="timestamp">just now</div>
        </div>

        <!-- external link -->
        ${this.foxLink
          ? html`
              <a
                class="source-link"
                href=${this.foxLink}
                target="_blank"
                rel="noopener noreferrer">
                View Source
              </a>`
          : ""}

      </div>
    `;
  }

  static get haxProperties() {
    return new URL(`./lib/${this.tag}.haxProperties.json`, import.meta.url).href;
  }
}

globalThis.customElements.define(InstaApp.tag, InstaApp);