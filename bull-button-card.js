/**
 * bull-button-card
 * A pill-shaped, entity-driven button card for Home Assistant
 * with flashing animation, custom colours, HA built-in icon picker, and a visual editor.
 */

// ─────────────────────────────────────────────
// VISUAL EDITOR
// ─────────────────────────────────────────────
class BullButtonCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const entityPicker = this.shadowRoot.getElementById("entity");
    const iconPicker   = this.shadowRoot.getElementById("icon");
    if (entityPicker) entityPicker.hass = hass;
    if (iconPicker)   iconPicker.hass   = hass;
    if (!entityPicker) this._render();
  }

  _fire(config) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _render() {
    const c = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--primary-font-family, 'Segoe UI', sans-serif);
        }
        .editor { padding: 8px 0; display: flex; flex-direction: column; gap: 0; }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--secondary-text-color);
          margin: 18px 0 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.12));
        }
        .row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
        }
        .row label {
          flex: 0 0 160px;
          font-size: 13px;
          color: var(--primary-text-color);
        }
        .row input[type="text"],
        .row select {
          flex: 1;
          height: 34px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          padding: 0 10px;
          font-size: 13px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          box-sizing: border-box;
        }
        .row input[type="text"]:focus,
        .row select:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        .color-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
        }
        .color-row label {
          flex: 0 0 160px;
          font-size: 13px;
          color: var(--primary-text-color);
        }
        .color-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .color-wrap input[type="color"] {
          width: 42px;
          height: 34px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          padding: 2px;
          cursor: pointer;
          background: none;
        }
        .color-wrap input[type="text"] {
          flex: 1;
          height: 34px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          padding: 0 10px;
          font-size: 13px;
          font-family: monospace;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
        }
        .toggle-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
        }
        .toggle-row label {
          flex: 0 0 160px;
          font-size: 13px;
          color: var(--primary-text-color);
        }
        .toggle { position: relative; width: 44px; height: 24px; }
        .toggle input { display: none; }
        .toggle-slider {
          position: absolute;
          inset: 0;
          background: var(--disabled-text-color, #ccc);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .toggle-slider::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          left: 3px;
          top: 3px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .toggle input:checked + .toggle-slider { background: var(--primary-color, #03a9f4); }
        .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
        ha-entity-picker,
        ha-icon-picker { flex: 1; }
      </style>
      <div class="editor">

        <div class="section-title">Entity &amp; Label</div>

        <div class="row">
          <label>Entity</label>
          <ha-entity-picker id="entity" allow-custom-entity></ha-entity-picker>
        </div>

        <div class="row">
          <label>Friendly Name</label>
          <input type="text" id="name" placeholder="e.g. Living Room Light" value="${c.name || ""}">
        </div>

        <div class="section-title">Colours</div>

        <div class="color-row">
          <label>Active Colour <span style="font-size:10px;opacity:.7">(entity ON)</span></label>
          <div class="color-wrap">
            <input type="color" id="active_color_picker" value="${c.active_color || "#ff3b3b"}">
            <input type="text"  id="active_color"        value="${c.active_color || "#ff3b3b"}" placeholder="#ff3b3b">
          </div>
        </div>

        <div class="color-row">
          <label>Inactive Colour <span style="font-size:10px;opacity:.7">(entity OFF)</span></label>
          <div class="color-wrap">
            <input type="color" id="inactive_color_picker" value="${c.inactive_color || "#2c2c2e"}">
            <input type="text"  id="inactive_color"        value="${c.inactive_color || "#2c2c2e"}" placeholder="#2c2c2e">
          </div>
        </div>

        <div class="color-row">
          <label>Name Text Colour</label>
          <div class="color-wrap">
            <input type="color" id="name_color_picker" value="${c.name_color || "#ffffff"}">
            <input type="text"  id="name_color"        value="${c.name_color || "#ffffff"}" placeholder="#ffffff">
          </div>
        </div>

        <div class="color-row">
          <label>Icon Colour</label>
          <div class="color-wrap">
            <input type="color" id="icon_color_picker" value="${c.icon_color || "#ffffff"}">
            <input type="text"  id="icon_color"        value="${c.icon_color || "#ffffff"}" placeholder="#ffffff">
          </div>
        </div>

        <div class="section-title">Flash Animation</div>

        <div class="toggle-row">
          <label>Enable Flash</label>
          <label class="toggle">
            <input type="checkbox" id="flash_enabled" ${c.flash_enabled !== false ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="row">
          <label>Flash Speed (ms)</label>
          <input type="text" id="flash_speed" value="${c.flash_speed || 600}" placeholder="600">
        </div>

        <div class="section-title">Icon</div>

        <div class="toggle-row">
          <label>Show Icon</label>
          <label class="toggle">
            <input type="checkbox" id="show_icon" ${c.show_icon ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="row">
          <label>Icon</label>
          <ha-icon-picker id="icon" placeholder="mdi:lightbulb"></ha-icon-picker>
        </div>

        <div class="section-title">Layout</div>

        <div class="row">
          <label>Text Alignment</label>
          <select id="text_align">
            <option value="left"   ${c.text_align === "left"                          ? "selected" : ""}>Left</option>
            <option value="center" ${(!c.text_align || c.text_align === "center")     ? "selected" : ""}>Center</option>
            <option value="right"  ${c.text_align === "right"                         ? "selected" : ""}>Right</option>
          </select>
        </div>

        <div class="row">
          <label>Font Size</label>
          <input type="text" id="font_size"  value="${c.font_size  || "14px"}" placeholder="14px">
        </div>

        <div class="row">
          <label>Card Height</label>
          <input type="text" id="card_height" value="${c.card_height || "54px"}" placeholder="54px">
        </div>

      </div>
    `;

    const bind = (id, key) => {
      const el = this.shadowRoot.getElementById(id);
      if (!el) return;
      const update = () => { this._config = { ...this._config, [key]: el.value }; this._fire(this._config); };
      el.addEventListener("change", update);
      if (el.type === "text") el.addEventListener("input", update);
    };

    const bindCheckbox = (id, key) => {
      const el = this.shadowRoot.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => { this._config = { ...this._config, [key]: el.checked }; this._fire(this._config); });
    };

    const bindColorPair = (pickerId, textId, key) => {
      const picker = this.shadowRoot.getElementById(pickerId);
      const text   = this.shadowRoot.getElementById(textId);
      if (!picker || !text) return;
      picker.addEventListener("input", () => {
        text.value = picker.value;
        this._config = { ...this._config, [key]: picker.value };
        this._fire(this._config);
      });
      text.addEventListener("input", () => {
        const val = text.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          picker.value = val;
          this._config = { ...this._config, [key]: val };
          this._fire(this._config);
        }
      });
    };

    // ha-entity-picker — must be wired imperatively
    const entityPicker = this.shadowRoot.getElementById("entity");
    if (entityPicker && this._hass) {
      entityPicker.hass  = this._hass;
      entityPicker.value = c.entity || "";
      entityPicker.addEventListener("value-changed", (e) => {
        this._config = { ...this._config, entity: e.detail.value };
        this._fire(this._config);
      });
    }

    // ha-icon-picker — must be wired imperatively
    const iconPicker = this.shadowRoot.getElementById("icon");
    if (iconPicker) {
      if (this._hass) iconPicker.hass = this._hass;
      iconPicker.value = c.icon || "";
      iconPicker.addEventListener("value-changed", (e) => {
        this._config = { ...this._config, icon: e.detail.value };
        this._fire(this._config);
      });
    }

    bind("name",        "name");
    bind("flash_speed", "flash_speed");
    bind("text_align",  "text_align");
    bind("font_size",   "font_size");
    bind("card_height", "card_height");
    bindCheckbox("flash_enabled", "flash_enabled");
    bindCheckbox("show_icon",     "show_icon");
    bindColorPair("active_color_picker",   "active_color",   "active_color");
    bindColorPair("inactive_color_picker", "inactive_color", "inactive_color");
    bindColorPair("name_color_picker",     "name_color",     "name_color");
    bindColorPair("icon_color_picker",     "icon_color",     "icon_color");
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
    if (this._flashInterval) { clearInterval(this._flashInterval); this._flashInterval = null; }
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
      pill.style.boxShadow  = this._flashState ? `0 0 18px 4px ${active}88` : "none";
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
    this._hass.callService(domain, state.state === "on" ? "turn_off" : "turn_on", { entity_id: entity });
  }

  _render() {
    const c      = this._config;
    const align  = c.text_align || "center";
    const height = c.card_height || "54px";
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
          ${c.show_icon && c.icon ? `<ha-icon class="bull-icon" icon="${c.icon}"></ha-icon>` : ""}
          <span class="bull-name">${c.name || c.entity || "Button"}</span>
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelector(".bull-pill").addEventListener("click", () => this._toggle());
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
