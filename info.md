# Bull Button Card

A pill-shaped, entity-driven button card for Home Assistant with flash animation, custom colours, SVG icon support, and a fully featured visual editor.

![Bull Button Card — inactive state](preview1.png)

---

## What does it do?

**Bull Button Card** binds to any toggleable entity (switch, light, input boolean, etc.) and displays it as a sleek pill-shaped button on your dashboard.

- When the entity turns **on**, the card flashes a colour of your choice
- When the entity turns **off**, the card returns to a different colour of your choice
- Every colour, the flash speed, the label, and the layout are all adjustable from the **visual editor** — no YAML needed

![Bull Button Card — active / flashing state](preview2.png)

---

## Key features

- 🎨 **Custom colours** for active state, inactive state, label text, and icon
- ⚡ **Flash animation** with adjustable speed when entity is on
- 🔍 **Built-in icon picker** — browse and select any MDI icon from Home Assistant's native icon library
- 📐 **Text alignment** — left, centre, or right
- 🏷️ **Friendly name** — label your button independently of the entity ID
- 🖱️ **Full visual editor** — point-and-click configuration, no YAML required
- 📏 **Adjustable size** — control font size and card height

---

## Requirements

- Home Assistant **2023.6** or newer
- HACS **1.6.0** or newer (for HACS installation)

---

## Quick start

After installation, open your dashboard in edit mode, click **Add Card**, and search for **Bull Button Card**.

Pick your entity, set a friendly name, choose your colours, and you're done.
