/**
 * bull-button-card
 * A pill-shaped, entity-driven button card for Home Assistant
 * with flashing animation, custom colours, HA built-in icon picker, and a visual editor.
 */

// ─────────────────────────────────────────────
// EDITOR SCHEMA
// Passed to ha-form — HA renders all pickers natively
// ─────────────────────────────────────────────
const BULL_SCHEMA = [
  // ── Entity & Label ──────────────────────────
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

  // ── Colours ─────────────────────────────────
  {
    name: "active_color",
    label: "Active Colour (entity ON)",
    selector: { text: {} },
  },
  {
    name: "inactive_color",
    label: "Inactive Colour (entity OFF)",
    selector: { text: {} },
  },
  {
    name: "name_color",
    label: "Name Text Colour",
    selector: { text: {} },
  },
  {
    name: "icon_color",
    label: "Icon Colour",
    selector: { text: {} },
  },

  // ── Flash ────────────────────────────────────
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

  // ── Icon ─────────────────────────────────────
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

  // ── Layout ───────────────────────────────────
  {
    name: "text_align",
    label: "Text Alignment",
    selector: {
      select: {
        options: [
          { value: "left",   label: "Left"   },
          { value: "center", label: "Center" },
          { value: "right",  label: "Right"  },
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
// VISUAL EDITOR
// Uses ha-form — HA owns all picker rendering
// ─────────────────────────────────────────────
class BullButtonCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass   = null;
    this._form   = null;
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
    this._attach();
  }

  set hass(hass) {
    this._hass = hass;
    this._attach();
  }

  // Build the ha-form once; update its properties every time config or hass changes
  _attach() {
    if (!this._hass || !this._config) return;

    if (!this._form) {
      // Style the host
      const style = document.createElement("style");
      style.textContent = `
        :host { display: block; }
        ha-form { display: block; }
      `;
      this.shadowRoot.appendChild(style);

      // Create ha-form once
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (schema) => schema.label || schema.name;
      this._form.addEventListener("value-changed", (e) => {
        this._config = e.detail.value;
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.shadowRoot.appendChild(this._form);
    }

    // Update every time either config or hass changes
    this._form.hass   = this._hass;
    this._form.schema = BULL_SCHEMA;
    this._form.data   = this._config;
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
    pill.style.background = active;
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
            ? `<ha-icon class="bull-icon" icon="${c.icon}"></ha-icon>`
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
