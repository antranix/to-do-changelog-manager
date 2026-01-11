# To-Do Changelog Manager

A VS Code extension that helps you manage **to-do tasks** and **project changelogs** directly from dedicated side-panel views, keeping your development workflow organized and your release notes always up to date.

The extension provides **two visual interfaces**: one for managing To-Do items and another for building and maintaining a structured `CHANGELOG.md`.

---

## ✨ Features

### 📝 To-Do Manager View

Manage your development tasks without leaving VS Code:

* ➕ Add new to-do items
* ✏️ Edit existing tasks
* 🗑️ Delete tasks
* ✅ Mark tasks as completed
* 📌 Organize all tasks in a dedicated Tree View
* ⚡ Perform actions using **toolbar buttons and context menus**

---

### 📄 Changelog Manager View

Create and maintain changelogs visually and consistently:

* ➕ Add new versions
* 🧩 Add entries to predefined changelog sections:

  * Additions
  * Changes
  * Fixes
  * Deprecations
  * Removals
  * Security Changes
* ✏️ Edit or 🗑️ remove individual entries
* 🔄 Automatically keeps the **latest version at the top**
* 🧹 Omits empty sections for cleaner output
* 📁 Persists all changes directly into `CHANGELOG.md`

> The changelog interface and structure are **inspired by**
> [https://github.com/tobiaswaelde/vscode-simple-changelog](https://github.com/tobiaswaelde/vscode-simple-changelog)
> and implemented with custom logic and extended functionality.

---

## 🧭 User Interface

The extension adds **two sidebar views** to VS Code:

* **To-Do Manager**
* **Changelog Manager**

Each view includes:

* Toolbar buttons
* Context menu actions
* Real-time updates

No command-only workflow — everything is visual and intuitive.

---

## 🚀 Installation

1. Open **VS Code**
2. Go to **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for **To-Do Changelog Manager** [To-Do Changelog Manager](https://marketplace.visualstudio.com/items?itemName=AntranixDEV.to-do-changelog-manager)
4. Click **Install**

---

## 🖼️ Screenshots

### To-Do Manager View

![To-Do Manager View](https://github.com/antranix/to-do-changelog-manager/blob/main/screen/1.png)

Manage your development tasks using an intuitive tree view with quick actions to add, edit, delete, and mark items as completed.

---

### Changelog Manager View

![Changelog Manager View](https://github.com/antranix/to-do-changelog-manager/blob/main/screen/2.png)

Create and maintain structured changelogs visually, keeping versions ordered and sections clean.

---

## 🛠️ Usage

### To-Do Manager

* Open the **To-Do Manager** view
* Use the toolbar buttons to:

  * Add tasks
  * Edit tasks
  * Delete tasks
  * Mark tasks as completed

### Changelog Manager

* Open the **Changelog Manager** view
* Create new versions
* Add entries to specific sections
* Maintain a clean and structured `CHANGELOG.md`

All actions are available via toolbar buttons or right-click menus.

---

## 📦 Requirements

* Visual Studio Code **1.60+**

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
