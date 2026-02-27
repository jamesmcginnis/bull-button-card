/**

- bull-button-card v1.0.0
- Pill-shaped entity button with fade animation, custom colours,
- HA icon picker, animated icons, font style picker, and a visual editor.
- https://github.com/jamesmcginnis/bull-button-card
  */

// =============================================================================
// ICON ANIMATION MAP
// Returns a CSS animation shorthand for a given mdi: icon when entity is ON.
// =============================================================================
function getBullIconAnimation(icon) {
if (!icon) return “”;
const n = icon.toLowerCase();
if (/fan|turbine|spinner|loading|sync|refresh|reload|propeller|rotor|windmill|ceiling/.test(n))
return “bull-spin 1.5s linear infinite”;
if (/heart|pulse|cardio|health|ecg/.test(n))
return “bull-heartbeat 1.2s ease-in-out infinite”;
if (/bell|alarm|alert|siren|doorbell|ring|notification/.test(n))
return “bull-ring 1s ease-in-out infinite”;
if (/run|walk|motion|step|jump|bounce/.test(n))
return “bull-bounce 0.8s ease-in-out infinite”;
if (/water|wave|wash|ripple|swim/.test(n))
return “bull-sway 2s ease-in-out infinite”;
if (/lightning|electric|energy|bolt|zap/.test(n))
return “bull-zap 0.9s ease-in-out infinite”;
return “”;
}

// =============================================================================
// ha-form SCHEMAS
// Non-colour fields delegated to HA’s native form renderer.
// =============================================================================
const BULL_SCHEMA_TOP = [
{ name: “entity”, label: “Entity”, selector: { entity: {} } },
{ name: “name”,   label: “Friendly Name”, selector: { text: {} } },
];

const BULL_SCHEMA_FLASH = [
{ name: “flash_enabled”, label: “Enable Fade Animation”, selector: { boolean: {} } },
{
name: “flash_speed”,
label: “Fade Speed (ms)”,
selector: { number: { min: 150, max: 1500, step: 50, mode: “slider” } },
},
];

const BULL_SCHEMA_ICON = [
{ name: “show_icon”, label: “Show Icon”,  selector: { boolean: {} } },
{ name: “icon”,      label: “Icon”,       selector: { icon: {} } },
];

const BULL_SCHEMA_LAYOUT = [
{
name: “text_align”,
label: “Text Alignment”,
selector: {
select: {
options: [
{ value: “left”,   label: “Left”   },
{ value: “center”, label: “Center” },
{ value: “right”,  label: “Right”  },
],
},
},
},
{
name: “font_style”,
label: “Font Style”,
selector: {
select: {
options: [
{ value: “normal”,      label: “Normal”      },
{ value: “bold”,        label: “Bold”        },
{ value: “light”,       label: “Light”       },
{ value: “italic”,      label: “Italic”      },
{ value: “bold-italic”, label: “Bold Italic” },
],
},
},
},
{ name: “font_size”,   label: “Font Size (e.g. 14px)”,  selector: { text: {} } },
{ name: “card_height”, label: “Card Height (e.g. 54px)”, selector: { text: {} } },
];

// =============================================================================
// COLOUR CARD CONFIG
// =============================================================================
const COLOUR_FIELDS = [
{ key: “active_color”,   label: “Active”,     description: “Card colour when entity is ON”,  default: “#ff3b3b” },
{ key: “inactive_color”, label: “Inactive”,   description: “Card colour when entity is OFF”, default: “#2c2c2e” },
{ key: “name_color”,     label: “Label Text”, description: “Colour of the name text”,        default: “#ffffff” },
{ key: “icon_color”,     label: “Icon”,       description: “Colour of the icon”,             default: “#ffffff” },
];

// =============================================================================
// DEFAULT CONFIG
// =============================================================================
const BULL_DEFAULTS = {
active_color:   “#ff3b3b”,
inactive_color: “#2c2c2e”,
name_color:     “#ffffff”,
icon_color:     “#ffffff”,
flash_enabled:  true,
flash_speed:    600,
show_icon:      false,
icon:           “”,
text_align:     “center”,
font_style:     “normal”,
font_size:      “14px”,
card_height:    “54px”,
};

// =============================================================================
// VISUAL EDITOR
// Hybrid: ha-form for pickers/toggles/sliders,
//         native <input type="color"> for colour fields.
// =============================================================================
class BullButtonCardEditor extends HTMLElement {
constructor() {
super();
this.attachShadow({ mode: “open” });
this._config = {};
this._hass   = null;
this._built  = false;
this._forms  = {};
}

setConfig(config) {
this._config = Object.assign({}, BULL_DEFAULTS, config);
this._build();
this._syncColours();
this._syncForms();
}

set hass(hass) {
this._hass = hass;
this._build();
this._syncForms();
}

// Build the shadow DOM exactly once
_build() {
if (this._built || !this._hass) return;
this._built = true;

```
this.shadowRoot.innerHTML = `
  <style>
    :host { display: block; font-family: var(--primary-font-family, sans-serif); }

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
    .section svg { flex-shrink: 0; opacity: 0.7; }
    .section::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--divider-color, rgba(0,0,0,0.12));
    }

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
    }
    .colour-card:hover {
      box-shadow: 0 2px 10px rgba(0,0,0,0.12);
      border-color: var(--primary-color, #03a9f4);
    }
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
      min-width: 0;
    }
    .colour-hex:focus { outline: none; color: var(--primary-text-color); }
    .colour-edit-icon {
      opacity: 0;
      transition: opacity 0.15s;
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .colour-card:hover .colour-edit-icon { opacity: 1; }

    ha-form { display: block; }
  </style>

  <div class="section">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
    Entity &amp; Label
  </div>
  <div id="form-top"></div>

  <div class="section">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="10.5" r="2.5"/>
      <circle cx="17.5" cy="14.5" r="2.5"/><circle cx="10" cy="18" r="2.5"/>
    </svg>
    Colours
  </div>
  <div class="colour-grid" id="colour-grid"></div>

  <div class="section">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
    Animation
  </div>
  <div id="form-flash"></div>

  <div class="section">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
    Icon
  </div>
  <div id="form-icon"></div>

  <div class="section">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="15" y2="12"/>
      <line x1="3" y1="18" x2="18" y2="18"/>
    </svg>
    Layout
  </div>
  <div id="form-layout"></div>
`;

// Build colour cards
var grid = this.shadowRoot.getElementById("colour-grid");
for (var i = 0; i < COLOUR_FIELDS.length; i++) {
  var field = COLOUR_FIELDS[i];
  var val   = (this._config[field.key] || field.default).toLowerCase();
  var card  = document.createElement("div");
  card.className  = "colour-card";
  card.dataset.key = field.key;
  card.innerHTML   = '<label class="colour-swatch">'
    + '<div class="colour-swatch-preview" style="background:' + val + '"></div>'
    + '<input type="color" value="' + val + '">'
    + '</label>'
    + '<div class="colour-info">'
    + '<div class="colour-label">' + field.label + '</div>'
    + '<div class="colour-desc">' + field.description + '</div>'
    + '<div class="colour-hex-row">'
    + '<div class="colour-dot" style="background:' + val + '"></div>'
    + '<input class="colour-hex" type="text" value="' + val + '" maxlength="7" spellcheck="false">'
    + '<span class="colour-edit-icon">&#9998;</span>'
    + '</div></div>';
  this._wireColourCard(card, field.key);
  grid.appendChild(card);
}

// Build ha-form sections
this._makeForm("form-top",    BULL_SCHEMA_TOP);
this._makeForm("form-flash",  BULL_SCHEMA_FLASH);
this._makeForm("form-icon",   BULL_SCHEMA_ICON);
this._makeForm("form-layout", BULL_SCHEMA_LAYOUT);
```

}

_wireColourCard(card, key) {
var self     = this;
var picker   = card.querySelector(‘input[type=“color”]’);
var hexInput = card.querySelector(”.colour-hex”);
var preview  = card.querySelector(”.colour-swatch-preview”);
var dot      = card.querySelector(”.colour-dot”);

```
function apply(hex) {
  preview.style.background = hex;
  dot.style.background     = hex;
  picker.value             = hex;
  hexInput.value           = hex;
  self._config = Object.assign({}, self._config);
  self._config[key] = hex;
  self._fire();
}

picker.addEventListener("input",  function() { apply(picker.value); });
picker.addEventListener("change", function() { apply(picker.value); });
hexInput.addEventListener("input", function() {
  var v = hexInput.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) apply(v);
});
```

}

_makeForm(slotId, schema) {
var self = this;
var form = document.createElement(“ha-form”);
form.hass         = this._hass;
form.schema       = schema;
form.data         = this._config;
form.computeLabel = function(s) { return s.label || s.name; };
form.addEventListener(“value-changed”, function(e) {
self._config = Object.assign({}, self._config, e.detail.value);
self._syncColours();
self._fire();
});
this.shadowRoot.getElementById(slotId).appendChild(form);
this._forms[slotId] = form;
}

_syncForms() {
if (!this._built) return;
for (var id in this._forms) {
if (this._hass) this._forms[id].hass = this._hass;
this._forms[id].data = this._config;
}
}

_syncColours() {
if (!this._built) return;
for (var i = 0; i < COLOUR_FIELDS.length; i++) {
var field = COLOUR_FIELDS[i];
var card  = this.shadowRoot.querySelector(’.colour-card[data-key=”’ + field.key + ‘”]’);
if (!card) continue;
var val = (this._config[field.key] || field.default).toLowerCase();
card.querySelector(”.colour-swatch-preview”).style.background = val;
card.querySelector(”.colour-dot”).style.background            = val;
card.querySelector(‘input[type=“color”]’).value               = val;
card.querySelector(”.colour-hex”).value                       = val;
}
}

_fire() {
this.dispatchEvent(new CustomEvent(“config-changed”, {
detail:   { config: this._config },
bubbles:  true,
composed: true,
}));
}
}

customElements.define(“bull-button-card-editor”, BullButtonCardEditor);

// =============================================================================
// CARD
// =============================================================================
class BullButtonCard extends HTMLElement {
constructor() {
super();
this.attachShadow({ mode: “open” });
}

static getConfigElement() {
return document.createElement(“bull-button-card-editor”);
}

static getStubConfig() {
return Object.assign({ entity: “switch.example”, name: “My Button”, icon: “mdi:lightbulb” }, BULL_DEFAULTS);
}

setConfig(config) {
if (!config.entity) throw new Error(“bull-button-card: ‘entity’ is required.”);
this._config = Object.assign({}, BULL_DEFAULTS, config);
this._render();
}

set hass(hass) {
this._hass = hass;
this._updateState();
}

getCardSize() { return 1; }

_isOn() {
if (!this._hass || !this._config) return false;
var state = this._hass.states[this._config.entity];
return state && state.state === “on”;
}

_stopFlash() {
var pill   = this.shadowRoot.querySelector(”.bull-pill”);
var fStyle = this.shadowRoot.getElementById(“bull-flash-style”);
if (pill)   pill.style.removeProperty(“animation”);
if (fStyle) fStyle.textContent = “”;
}

_startFlash() {
this._stopFlash();
var pill   = this.shadowRoot.querySelector(”.bull-pill”);
var fStyle = this.shadowRoot.getElementById(“bull-flash-style”);
if (!pill || !fStyle) return;
var speed    = parseInt(this._config.flash_speed, 10) || 600;
var active   = this._config.active_color   || “#ff3b3b”;
var inactive = this._config.inactive_color || “#2c2c2e”;
var duration = speed * 2;
fStyle.textContent = “@keyframes bull-pulse {”
+ “0%,100%{background:” + inactive + “;box-shadow:none}”
+ “50%{background:” + active + “;box-shadow:0 0 22px 6px “ + active + “55}”
+ “}”;
pill.style.animation = “bull-pulse “ + duration + “ms ease-in-out infinite”;
}

_updateState() {
var pill = this.shadowRoot.querySelector(”.bull-pill”);
if (!pill) return;
var on   = this._isOn();
var icon = this.shadowRoot.querySelector(“ha-icon.bull-icon”);

```
// Toggle icon animation
if (icon) {
  if (on) icon.classList.add("icon-active");
  else    icon.classList.remove("icon-active");
}

if (on && this._config.flash_enabled !== false) {
  this._startFlash();
} else {
  this._stopFlash();
  var bg = on ? this._config.active_color : this._config.inactive_color;
  pill.style.background = bg || this._config.inactive_color;
  pill.style.boxShadow  = on ? "0 0 14px 3px " + bg + "66" : "none";
}
```

}

_toggle() {
if (!this._hass || !this._config) return;
var entity  = this._config.entity;
var domain  = entity.split(”.”)[0];
var state   = this._hass.states[entity];
if (!state) return;
this._hass.callService(domain, state.state === “on” ? “turn_off” : “turn_on”, { entity_id: entity });
}

_render() {
var c       = this._config;
var align   = c.text_align  || “center”;
var height  = c.card_height || “54px”;
var justify = align === “left” ? “flex-start” : align === “right” ? “flex-end” : “center”;

```
// Font style
var fontStyleMap = {
  "normal":      { weight: "400", style: "normal" },
  "bold":        { weight: "700", style: "normal" },
  "light":       { weight: "300", style: "normal" },
  "italic":      { weight: "400", style: "italic" },
  "bold-italic": { weight: "700", style: "italic" },
};
var fs       = fontStyleMap[c.font_style] || fontStyleMap["normal"];
var iconAnim = getBullIconAnimation(c.icon || "");

// Build icon animation CSS safely (no nested template literals)
var iconAnimCss = "";
if (iconAnim) {
  iconAnimCss = "ha-icon.bull-icon.icon-active { animation: " + iconAnim + "; }";
}

// Build icon HTML
var iconHtml = "";
if (c.show_icon && c.icon) {
  iconHtml = '<ha-icon class="bull-icon" icon="' + c.icon + '"></ha-icon>';
}

this.shadowRoot.innerHTML = "<style>"
  + ":host { display: block; }"
  + ".bull-card { background: transparent; padding: 0; border-radius: 9999px; }"
  + ".bull-pill {"
  + "  display: flex;"
  + "  align-items: center;"
  + "  justify-content: " + justify + ";"
  + "  height: " + height + ";"
  + "  border-radius: 9999px;"
  + "  padding: 0 18px;"
  + "  gap: 10px;"
  + "  cursor: pointer;"
  + "  user-select: none;"
  + "  transition: box-shadow 0.25s;"
  + "  position: relative;"
  + "  overflow: hidden;"
  + "  background: " + (c.inactive_color || "#2c2c2e") + ";"
  + "}"
  + ".bull-pill::after {"
  + "  content: '';"
  + "  position: absolute;"
  + "  inset: 0;"
  + "  background: white;"
  + "  opacity: 0;"
  + "  border-radius: inherit;"
  + "  transition: opacity 0.15s;"
  + "  pointer-events: none;"
  + "}"
  + ".bull-pill:active::after { opacity: 0.1; }"
  + "ha-icon.bull-icon {"
  + "  flex-shrink: 0;"
  + "  width: 24px; height: 24px;"
  + "  --mdc-icon-size: 24px;"
  + "  color: " + (c.icon_color || "#ffffff") + ";"
  + "  transition: color 0.25s;"
  + "}"
  + iconAnimCss
  + ".bull-name {"
  + "  font-family: var(--primary-font-family, var(--mdc-typography-font-family, inherit));"
  + "  font-size: " + (c.font_size || "14px") + ";"
  + "  font-weight: " + fs.weight + ";"
  + "  font-style: " + fs.style + ";"
  + "  color: " + (c.name_color || "#ffffff") + ";"
  + "  white-space: nowrap;"
  + "  overflow: hidden;"
  + "  text-overflow: ellipsis;"
  + "  flex: " + (align === "center" ? "unset" : "1") + ";"
  + "  text-align: " + align + ";"
  + "}"
  + "@keyframes bull-spin      { to { transform: rotate(360deg); } }"
  + "@keyframes bull-heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.2)} 28%{transform:scale(1)} 42%{transform:scale(1.15)} 56%{transform:scale(1)} }"
  + "@keyframes bull-ring      { 0%,100%{transform:rotate(0)} 10%{transform:rotate(14deg)} 20%{transform:rotate(-12deg)} 30%{transform:rotate(10deg)} 40%{transform:rotate(-8deg)} 50%{transform:rotate(6deg)} 70%{transform:rotate(2deg)} 80%{transform:rotate(0)} }"
  + "@keyframes bull-bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }"
  + "@keyframes bull-sway      { 0%,100%{transform:rotate(0)} 25%{transform:rotate(8deg)} 75%{transform:rotate(-8deg)} }"
  + "@keyframes bull-zap       { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:0.7} }"
  + "</style>"
  + "<ha-card class=\"bull-card\">"
  + "<div class=\"bull-pill\">"
  + iconHtml
  + "<span class=\"bull-name\">" + (c.name || c.entity || "Button") + "</span>"
  + "</div>"
  + "</ha-card>"
  + "<style id=\"bull-flash-style\"></style>";

this.shadowRoot.querySelector(".bull-pill").addEventListener("click", this._toggle.bind(this));
this._updateState();
```

}
}

customElements.define(“bull-button-card”, BullButtonCard);

window.customCards = window.customCards || [];
window.customCards.push({
type:             “bull-button-card”,
name:             “Bull Button Card”,
description:      “Pill-shaped entity button with fade animation, animated icons, custom colours, and a visual editor.”,
preview:          true,
documentationURL: “https://github.com/jamesmcginnis/bull-button-card”,
});

console.info(
“%c BULL-BUTTON-CARD %c v1.0.0 “,
“background:#1a1a2e;color:#e94560;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;”,
“background:#e94560;color:#fff;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;”
);