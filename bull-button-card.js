/**
 * bull-button-card
 * A pill-shaped, entity-driven button card for Home Assistant
 * with flashing animation, custom colours, HA built-in icon picker, and a visual editor.
 */

// ─────────────────────────────────────────────
// ha-form schema — non-colour fields only
// ─────────────────────────────────────────────
const BULL_SCHEMA_TOP = [
  {
    name: "entity",
    label: "Entity",
    selector: { entity: {} },
  },
  {
    name: "name",
    label: "Friendly Name",
    selector: { text: {} },
  },
];

const BULL_SCHEMA_FLASH = [
  {
    name: "flash_enabled",
    label: "Enable Flash Animation",
    selector: { boolean: {} },
  },
  {
    name: "flash_speed",
    label: "Flash Speed (ms)",
    selector: { number: { min: 150, max: 1500, step: 50, mode: "slider" } },
  },
];

const BULL_SCHEMA_ICON = [
  {
    name: "show_icon",
    label: "Show Icon",
    selector: { boolean: {} },
  },
  {
    name: "icon",
    label: "Icon",
    selector: { icon: {} },
  },
];

const BULL_SCHEMA_LAYOUT = [
  {
    name: "text_align",
    label: "Text Alignment",
    selector: {
      select: {
        options: [
          { value: "left",   label: "⬅  Left"   },
          { value: "center", label: "↔  Center" },
          { value: "right",  label: "➡  Right"  },
        ],
      },
    },
  },
  {
    name: "font_size",
    label: "Font Size (e.g. 14px)",
    selector: { text: {} },
  },
  {
    name: "card_height",
    label: "Card Height (e.g. 54px)",
    selector: { text: {} },
  },
];

// ─────────────────────────────────────────────
// COLOUR CONFIG
// ─────────────────────────────────────────────
const COLOUR_FIELDS = [
  {
    key:         "active_color",
    label:       "Active",
    description: "Card colour when entity is ON",
    default:     "#ff3b3b",
  },
  {
    key:         "inactive_color",
    label:       "Inactive",
    description: "Card colour when entity is OFF",
    default:     "#2c2c2e",
  },
  {
    key:         "name_color",
    label:       "Label Text",
    description: "Colour of the name text",
    default:     "#ffffff",
  },
  {
    key:         "icon_color",
    label:       "Icon",
    description: "Colour of the icon",
    default:     "#ffffff",
  },
];

// ─────────────────────────────────────────────
// VISUAL EDITOR
// Hybrid: ha-form for pickers/toggles/sliders,
// native <input type=color> for colour fields
// ─────────────────────────────────────────────
class BullButtonCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config   = {};
    this._hass     = null;
    this._built    = false;
    this._forms    = {};   // keyed by section name
  }

  setConfig(config) {
    this._config = {
      active_color:   "#ff3b3b",
      inactive_color: "#2c2c2e",
      name_color:     "#ffffff",
      icon_color:     "#ffffff",
      flash_enabled:  true,
      flash_speed:    600,
      show_icon:      false,
      icon:           "",
      text_align:     "center",
      font_size:      "14px",
      card_height:    "54px",
      ...config,
    };
    this._build();
    this._syncColours();
    this._syncForms();
  }

  set hass(hass) {
    this._hass = hass;
    this._build();
    this._syncForms();
  }

  // ── Build the shadow DOM once ──────────────────────────────────
  _build() {
    if (this._built || !this._hass) return;
    this._built = true;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--primary-font-family, 'Segoe UI', sans-serif);
        }

        /* ── Section headers ── */
        .section {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 20px 0 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: var(--secondary-text-color, #6b7280);
        }
        .section svg {
          flex-shrink: 0;
          opacity: 0.7;
        }
        .section::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--divider-color, rgba(0,0,0,0.12));
        }

        /* ── Colour grid ── */
        .colour-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 4px;
        }

        .colour-card {
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s;
          position: relative;
        }
        .colour-card:hover {
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
          border-color: var(--primary-color, #03a9f4);
        }

        /* Top swatch strip */
        .colour-swatch {
          height: 44px;
          width: 100%;
          display: block;
          position: relative;
        }
        .colour-swatch input[type="color"] {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .colour-swatch-preview {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        /* Checkerboard fallback for transparent */
        .colour-swatch::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
          opacity: 0.3;
          pointer-events: none;
        }

        /* Bottom label + hex row */
        .colour-info {
          padding: 6px 8px 7px;
          background: var(--card-background-color, #fff);
        }
        .colour-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--primary-text-color);
          letter-spacing: 0.02em;
          margin-bottom: 1px;
        }
        .colour-desc {
          font-size: 10px;
          color: var(--secondary-text-color, #6b7280);
          margin-bottom: 4px;
          line-height: 1.3;
        }
        .colour-hex-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .colour-dot {
          width: 12px; height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.15);
          flex-shrink: 0;
        }
        .colour-hex {
          flex: 1;
          font-size: 11px;
          font-family: monospace;
          border: none;
          background: none;
          color: var(--secondary-text-color, #6b7280);
          padding: 0;
          width: 0; /* flex will grow it */
          min-width: 0;
        }
        .colour-hex:focus {
          outline: none;
          color: var(--primary-text-color);
        }
        .colour-edit-icon {
          opacity: 0;
          transition: opacity 0.15s;
          color: var(--secondary-text-color);
          font-size: 14px;
          line-height: 1;
        }
        .colour-card:hover .colour-edit-icon {
          opacity: 1;
        }

        /* ── ha-form blocks ── */
        ha-form {
          display: block;
        }
      </style>

      <!-- Entity & Label -->
      <div class="section">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
        Entity &amp; Label
      </div>
      <div id="form-top"></div>

      <!-- Colours -->
      <div class="section">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="10.5" r="2.5"/><circle cx="17.5" cy="14.5" r="2.5"/><circle cx="10" cy="18" r="2.5"/></svg>
        Colours
      </div>
      <div class="colour-grid" id="colour-grid"></div>

      <!-- Flash Animation -->
      <div class="section">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        Flash Animation
      </div>
      <div id="form-flash"></div>

      <!-- Icon -->
      <div class="section">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Icon
      </div>
      <div id="form-icon"></div>

      <!-- Layout -->
      <div class="section">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        Layout
      </div>
      <div id="form-layout"></div>
    `;

    // ── Build colour grid ───────────────────────────────────────
    const grid = this.shadowRoot.getElementById("colour-grid");
    for (const field of COLOUR_FIELDS) {
      const val = (this._config[field.key] || field.default).toLowerCase();

      const card = document.createElement("div");
      card.className = "colour-card";
      card.dataset.key = field.key;
      card.innerHTML = `
        <label class="colour-swatch">
          <div class="colour-swatch-preview" style="background:${val}"></div>
          <input type="color" value="${val}">
        </label>
        <div class="colour-info">
          <div class="colour-label">${field.label}</div>
          <div class="colour-desc">${field.description}</div>
          <div class="colour-hex-row">
            <div class="colour-dot" style="background:${val}"></div>
            <input class="colour-hex" type="text" value="${val}" maxlength="7" spellcheck="false">
            <span class="colour-edit-icon">✎</span>
          </div>
        </div>
      `;

      const nativePicker = card.querySelector("input[type=color]");
      const hexInput     = card.querySelector(".colour-hex");
      const preview      = card.querySelector(".colour-swatch-preview");
      const dot          = card.querySelector(".colour-dot");

      const apply = (hex) => {
        preview.style.background = hex;
        dot.style.background     = hex;
        nativePicker.value       = hex;
        hexInput.value           = hex;
        this._config = { ...this._config, [field.key]: hex };
        this._fire();
      };

      nativePicker.addEventListener("input",  () => apply(nativePicker.value));
      nativePicker.addEventListener("change", () => apply(nativePicker.value));

      hexInput.addEventListener("input", () => {
        const v = hexInput.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v)) apply(v);
      });
      hexInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") hexInput.blur();
      });

      grid.appendChild(card);
    }

    // ── Build ha-form blocks ────────────────────────────────────
    const makeForm = (slotId, schema) => {
      const form = document.createElement("ha-form");
      form.hass         = this._hass;
      form.schema       = schema;
      form.data         = this._config;
      form.computeLabel = (s) => s.label || s.name;
      form.addEventListener("value-changed", (e) => {
        this._config = { ...this._config, ...e.detail.value };
        this._syncColours();
        this._fire();
      });
      this.shadowRoot.getElementById(slotId).appendChild(form);
      this._forms[slotId] = form;
    };

    makeForm("form-top",    BULL_SCHEMA_TOP);
    makeForm("form-flash",  BULL_SCHEMA_FLASH);
    makeForm("form-icon",   BULL_SCHEMA_ICON);
    makeForm("form-layout", BULL_SCHEMA_LAYOUT);
  }

  // ── Keep ha-form data in sync ──────────────────────────────────
  _syncForms() {
    if (!this._built) return;
    for (const form of Object.values(this._forms)) {
      if (this._hass) form.hass = this._hass;
      form.data = this._config;
    }
  }

  // ── Keep colour swatches in sync ───────────────────────────────
  _syncColours() {
    if (!this._built) return;
    for (const field of COLOUR_FIELDS) {
      const card = this.shadowRoot.querySelector(`.colour-card[data-key="${field.key}"]`);
      if (!card) continue;
      const val  = (this._config[field.key] || field.default).toLowerCase();
      card.querySelector(".colour-swatch-preview").style.background = val;
      card.querySelector(".colour-dot").style.background            = val;
      card.querySelector("input[type=color]").value                 = val;
      card.querySelector(".colour-hex").value                       = val;
    }
  }

  // ── Fire config-changed ─────────────────────────────────────────
  _fire() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail:   { config: this._config },
        bubbles:  true,
        composed: true,
      })
    );
  }
}

customElements.define("bull-button-card-editor", BullButtonCardEditor);

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────
class BullButtonCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._flashInterval = null;
    this._flashState    = false;
  }

  static getConfigElement() {
    return document.createElement("bull-button-card-editor");
  }

  static getStubConfig() {
    return {
      entity:         "switch.example",
      name:           "My Button",
      active_color:   "#ff3b3b",
      inactive_color: "#2c2c2e",
      name_color:     "#ffffff",
      icon_color:     "#ffffff",
      flash_enabled:  true,
      flash_speed:    600,
      show_icon:      false,
      icon:           "mdi:lightbulb",
      text_align:     "center",
      font_size:      "14px",
      card_height:    "54px",
    };
  }

  setConfig(config) {
    if (!config.entity) throw new Error("bull-button-card: 'entity' is required.");
    this._config = {
      active_color:   "#ff3b3b",
      inactive_color: "#2c2c2e",
      name_color:     "#ffffff",
      icon_color:     "#ffffff",
      flash_enabled:  true,
      flash_speed:    600,
      show_icon:      false,
      icon:           "",
      text_align:     "center",
      font_size:      "14px",
      card_height:    "54px",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateState();
  }

  getCardSize() { return 1; }

  _isOn() {
    if (!this._hass || !this._config) return false;
    const state = this._hass.states[this._config.entity];
    return state && state.state === "on";
  }

  _stopFlash() {
    if (this._flashInterval) {
      clearInterval(this._flashInterval);
      this._flashInterval = null;
    }
  }

  _startFlash() {
    this._stopFlash();
    const pill   = this.shadowRoot.querySelector(".bull-pill");
    if (!pill) return;
    const speed  = parseInt(this._config.flash_speed, 10) || 600;
    const active = this._config.active_color || "#ff3b3b";
    this._flashState      = true;
    pill.style.transition = "none";
    pill.style.background = active;
    pill.style.boxShadow  = `0 0 18px 4px ${active}88`;
    this._flashInterval   = setInterval(() => {
      this._flashState      = !this._flashState;
      pill.style.background = this._flashState ? active : "transparent";
      pill.style.boxShadow  = this._flashState
        ? `0 0 18px 4px ${active}88`
        : "none";
    }, speed);
  }

  _updateState() {
    const pill = this.shadowRoot.querySelector(".bull-pill");
    if (!pill) return;
    const on = this._isOn();
    if (on && this._config.flash_enabled !== false) {
      this._startFlash();
    } else {
      this._stopFlash();
      pill.style.transition = "";
      const bg = on ? this._config.active_color : this._config.inactive_color;
      pill.style.background = bg || this._config.inactive_color;
      pill.style.boxShadow  = on ? `0 0 14px 3px ${bg}66` : "none";
    }
  }

  _toggle() {
    if (!this._hass || !this._config) return;
    const entity  = this._config.entity;
    const domain  = entity.split(".")[0];
    const state   = this._hass.states[entity];
    if (!state) return;
    this._hass.callService(
      domain,
      state.state === "on" ? "turn_off" : "turn_on",
      { entity_id: entity }
    );
  }

  _render() {
    const c       = this._config;
    const align   = c.text_align || "center";
    const height  = c.card_height || "54px";
    const justify =
      align === "left"  ? "flex-start" :
      align === "right" ? "flex-end"   : "center";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .bull-card { background: transparent; padding: 0; border-radius: 9999px; }
        .bull-pill {
          display: flex;
          align-items: center;
          justify-content: ${justify};
          height: ${height};
          border-radius: 9999px;
          padding: 0 18px;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          transition: background 0.25s, box-shadow 0.25s;
          position: relative;
          overflow: hidden;
          background: ${c.inactive_color || "#2c2c2e"};
        }
        .bull-pill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: white;
          opacity: 0;
          border-radius: inherit;
          transition: opacity 0.15s;
          pointer-events: none;
        }
        .bull-pill:active::after { opacity: 0.1; }
        ha-icon.bull-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          --mdc-icon-size: 24px;
          color: ${c.icon_color || "#ffffff"};
        }
        .bull-name {
          font-size: ${c.font_size || "14px"};
          font-weight: 600;
          color: ${c.name_color || "#ffffff"};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: ${align === "center" ? "unset" : "1"};
          text-align: ${align};
          letter-spacing: 0.02em;
        }
      </style>
      <ha-card class="bull-card">
        <div class="bull-pill">
          ${c.show_icon && c.icon
            ? `<div class="bull-icon-container"><ha-icon class="bull-icon" icon="${c.icon}"></ha-icon></div>`
            : ""}
          <span class="bull-name">${c.name || c.entity || "Button"}</span>
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelector(".bull-pill")
      .addEventListener("click", () => this._toggle());

    this._updateState();
  }
}

customElements.define("bull-button-card", BullButtonCard);

// ── Register with Home Assistant ────────────────
window.customCards = window.customCards || [];
window.customCards.push({
  type:             "bull-button-card",
  name:             "Bull Button Card",
  description:      "A pill-shaped entity button with flash animation, custom colours, built-in icon picker, and a visual editor.",
  preview:          true,
  documentationURL: "https://github.com/jamesmcginnis/bull-button-card",
});

console.info(
  "%c BULL-BUTTON-CARD %c v1.0.0 ",
  "background:#1a1a2e;color:#e94560;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;",
  "background:#e94560;color:#fff;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;"
);
