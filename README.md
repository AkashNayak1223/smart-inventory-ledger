# LEDGER.OS — MERN Stack Item Management System

A high-performance, minimalist item management and inventory tracking web application built with Node.js, Express, and modern JavaScript. Features continuous serial re-indexing, real-time search filtering, dynamic metrics calculation, and a clean fintech-inspired user interface.

---

##  Key Features

- **Full CRUD Operations**:
  - **Create**: Add new items with real-time validation.
  - **Read**: Fetch and display items with continuous serial numbers (`#01`, `#02`, etc.).
  - **Update**: Pre-fill form fields, toggle edit mode, and save changes inline.
  - **Delete**: Custom modal confirmation preventing accidental deletions.
- **Continuous Sequential Re-indexing**: Automatically recalculates continuous serial numbers whenever records are removed.
- **Real-Time Search & Filter**: Instantly filter records by item name or price threshold without reloading.
- **Multi-criteria Sorting**: Sort items by Serial Number (Asc/Desc), Price (Low to High / High to Low), or Item Name (A to Z).
- **Live KPI Analytics Strip**: Dynamically computes **Total Items**, **Total Inventory Valuation**, and **Average Unit Price**.
- **Minimalist Fintech UI**: Clean monochrome typography (Inter & JetBrains Mono), custom toast notifications, and zero external frontend dependencies for maximum speed and simplicity.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express 5 |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, Modern CSS3 (Variables, Flexbox, Grid) |
| **Fonts** | Inter, JetBrains Mono |
| **Architecture** | RESTful API + Static File Serving |

---

## 📡 REST API Reference

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/items` | Retrieve all inventory items | None | `200 OK` (Array of items) |
| `POST` | `/items` | Create a new item | `{ "name": "string", "price": number }` | `201 Created` (New item object) |
| `PUT` | `/items/:id` | Update an existing item | `{ "name": "string", "price": number }` | `200 OK` (Updated item object) |
| `DELETE` | `/items/:id` | Delete an item & re-sequence IDs | None | `200 OK` (Status message & re-sequenced items) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (Node Package Manager)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd mern-task-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   node server.js
   ```

4. **Access the application:**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
mern-task-app/
├── public/
│   ├── index.html        # Clean semantic application markup
│   ├── script.js         # REST client, real-time search & filter, KPI metrics, modal logic
│   └── style.css         # Fintech design system, typography, and responsive grid
├── package.json          # Project metadata and Express dependency
├── package-lock.json     # Dependency lockfile
├── server.js             # Express REST API & sequential re-indexing controller
└── README.md             # Project documentation
```

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
