# 🔍 Floorplan 3D Visualization (z\_sap\_btp\_decp)

An SAPUI5 application for visualizing warehouse or factory floorplans in 3D using Three.js. Real-time asset location data helps improve operational visibility and space management.

Generated with SAP Fiori Application Generator.
SAPUI5 version: 1.138.1 (Horizon Dark Theme, TypeScript)

---

## 🚀 Features

* Display 3D floorplan objects (cubes, models)
* Toggle object visibility via UI controls
* Navigate camera view to specific objects
* Add or remove objects dynamically at runtime
* Manage scene objects in SAPUI5 JSON Model (`3jsobject`)
* Tabbed side panel for visibility toggles and navigation

---

## 🧾 Prerequisites

* **Node.js LTS** and compatible NPM version
* SAP Fiori Tools (used for generating application scaffolding)
* A modern browser (Chrome, Firefox, Edge)

---

## ⚙️ Installation & Running

1. Clone the repository:

   ```bash
   git clone https://github.com/lethucthanhtu/z_sap_btp_decp.git
   cd z_sap_btp_decp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the app locally:

   ```bash
   npm start
   ```

   This opens the application in your default browser with live reloading.

---

## 📁 Project Structure

```
z_sap_btp_decp/
│
├── webapp/
│   ├── controller/     → ThreeJS.controller.ts
│   ├── view/           → XML view files
│   ├── model/          → 3JSMs.json (scene object definitions)
│   ├── i18n            → translations
│
├── ui5.yaml            → UI5 project configuration
├── tsconfig.json       → TypeScript config
├── .eslintrc / .prettierrc → Linting & formatting
└── package.json        → NPM scripts and dependencies
```

---

## 🧩 Usage Overview

### Initialization

* Loads default objects from `3JSMs.json`
* Sets up Three.js scene, camera, renderer, and OrbitControls
* Binds object list to UI model (`3jsobject`) for controls in side panel

### Visibility Toggle

* Side panel “Toggle” tab displays a list of checkboxes (bound to 3jsobject model)
* `onToggleModel` sets the `visible` flag on corresponding Three.js mesh

### Navigate Feature

* “Go To” tab lists object buttons
* `onNavigateToObject` centers camera view at the selected object’s position

### Adding / Removing Objects

* Click on canvas to place a cube (if Shift key is not pressed)
* Shift-click on a cube to remove it from both the scene and UI model

---

## 🛠 Extend or Customize

* **Object Types**: Add new asset types (e.g. `.obj`, `.fbx`) beyond cubes or GLB models
* **UI Enhancements**: Include fully searchable tables, grouping, or filtering
* **Persistence**: Export / import updated object lists back to `.json` or backend storage
* **Deployment**: Host the built app on SAP BTP, static web servers, or Vercel (configured via `vercel.json`)

---

## 📌 Development Scripts (via `package.json`)

* `npm start`: Run locally in development mode
* `npm run build`: Generate production artifact
* `npm run lint`: Run ESLint to check code quality
* `npm run test` *(if added)*: Execute unit or integration tests

---

### 📚 References

* Generated with SAP Fiori tools: *App Generator v1.18.3*
* UI5: `sap_horizon_dark`, TypeScript-based
* Source architecture inspiration: SAP BTP + SAPUI5 + Three.js asset visualization ([github.com][1], [help.sap.com][2], [learning.sap.com][3], [github.com][4], [community.sap.com][5])

[1]: https://github.com/lethucthanhtu/z_sap_btp_decp?utm_source=chatgpt.com "lethucthanhtu/z_sap_btp_decp - GitHub"
[2]: https://help.sap.com/docs/btp?locale=en-+US&utm_source=chatgpt.com "SAP Help Portal | SAP Online Help"
[3]: https://learning.sap.com/learning-journeys/exploring-the-fundamentals-of-sap-system-security/introducing-sap-btp-security?utm_source=chatgpt.com "Introducing SAP BTP Security"
[4]: https://github.com/topics/sap-btp?utm_source=chatgpt.com "sap-btp · GitHub Topics · GitHub"
[5]: https://community.sap.com/t5/technology-blog-posts-by-sap/learn-how-to-develop-in-abap-using-sap-btp-abap-environment/ba-p/13492682?utm_source=chatgpt.com "Learn how to develop in ABAP using SAP BTP ABAP Environment"
