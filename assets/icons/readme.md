# ShopMate Icon Library

## Purpose

This folder contains all SVG icons used throughout the ShopMate application.

To ensure a consistent user experience and simplify future maintenance, all application icons follow a single design language based on the **Lucide Icon Library**.

The goal is to:

- Maintain a clean and professional UI.
- Keep icon usage consistent across the application.
- Make it easy for future developers to locate and replace icons.
- Avoid duplicate or inconsistent icon designs.

---

# Folder Structure

```
icons/
│
├── actions/
├── navigation/
├── features/
├── biometric/
└── brands/
```

---

# Folder Descriptions

## actions/

Contains icons representing user actions.

Examples:

- Add
- Edit
- Delete
- Favorite
- Search
- Purchased
- Re-add
- Package Placeholder

---

## navigation/

Contains icons used for application navigation.

Examples:

- Menu
- Back
- Close
- Expand
- Collapse

---

## features/

Contains icons representing application modules or features.

Examples:

- Budget
- Group
- Notifications
- Settings
- Export
- Import

---

## biometric/

Contains authentication icons.

Examples:

- Fingerprint
- Face ID

---

## brands/

Reserved for third-party company or platform logos.

Examples:

- Google
- Apple
- Microsoft
- Woolworths
- Coles

These are intentionally separated from application icons.

---

# Naming Convention

All icons are named based on **their purpose inside ShopMate**, not based on the original Lucide filename.

Examples:

| Purpose      | File Name        |
| ------------ | ---------------- |
| Add Item     | add.svg          |
| Delete Item  | delete.svg       |
| Favorite     | favorite.svg     |
| Notification | notification.svg |
| Group        | group.svg        |
| Budget       | budget.svg       |

This makes the project easier to understand for future developers.

---

# Design Standards

- Icon Family: **Lucide**
- Style: Outline
- Format: SVG
- Color: Controlled using CSS
- Size: Controlled using CSS
- No PNG icons
- No Emoji icons
- No Unicode symbols used as UI icons

---

# Do Not

- Mix icon families.
- Use bitmap (PNG/JPG) icons for UI.
- Embed random SVGs from the internet.
- Rename icons without updating references.
- Create duplicate icons with different names.

---

# Future Guidelines

When adding a new icon:

1. Download it from the official Lucide icon library.
2. Rename it according to its purpose in ShopMate.
3. Place it in the correct folder.
4. Reuse an existing icon whenever possible.
5. Keep the UI consistent.

---

# Maintainer Notes

This structure was introduced during **Module 4 – UI Icon Standardization** to improve maintainability and visual consistency across the ShopMate application.

Please preserve this structure when adding new features.
