<div align="center">

# THE END

<p align="center">
  <strong>Movie Schedule and Box Office Management Application</strong>
</p>

<sub> Created by: </sub>
<p align="center">
  <a href="https://github.com/jailisita">Jailiss Gómez</a> ·
  <a href="https://github.com/jemcu">Gemima Cerpa</a> ·
  <a href="https://github.com/mptse">Melany Tesillo</a> ·
  <a href="https://github.com/emilymontec">Emily Monterrosa</a>
</p>

<img src="https://img.shields.io/badge/backend-node.js-fcf6e6?style=flat-square">
<img src="https://img.shields.io/badge/frontend-react-4e0115?style=flat-square">
<img src="https://img.shields.io/badge/database-supabase-fcf6e6?style=flat-square">

</div>

---

We are a student group focused on exploring emerging technologies and developing innovative solutions.

As part of our learning and experimentation process, we have created a web application designed to streamline cinema management. It allows you to manage movies, showtimes, users, and ticket sales through an intuitive interface and a secure access control system.

It also features interactive seat selection, QR code generation for ticket validation, and real-time administrative reports.

| | |
|---|---|
| **Movie Management** | creating movies, editing, deleting movies, uploading posters, activating/deactivating movies, marking movies as featured, filtering by genre, searching by title. |
| **Showtime Management** | creating, editing, deleting showtimes, setting prices, and managing ticket sales. |
| **Ticket Management** | interactive seat selection, QR code generation for ticket validation, and real-time statistics on tickets sales. |
| **User Management** | creating, editing, deleting users, setting roles, and history of access logs. |

You can do all of this here.

---

## Functions such as...

<table>
<tr>
<td width="50%" valign="top">

<h3>Administrator</h3>

You can manage movies, features, and users, as well as access statistics, sales reports, and ticket validation.

</td>
<td width="50%" valign="top">

<h3>Operator</h3>

Sell tickets, validate tickets, and view basic statistics.

</td>
</tr>
</table>

---

## Technologies Used

<img src="https://img.shields.io/badge/Node.js-+22-fcf6e6?style=flat-square"> <img src="https://img.shields.io/badge/Express.js-+5.2-4e0115?style=flat-square"> <img src="https://img.shields.io/badge/React-+19.0-fcf6e6?style=flat-square"> <img src="https://img.shields.io/badge/Vite-6.0-4e0115?style=flat-square"> <img src="https://img.shields.io/badge/Supabase-PostgreSQL-fcf6e6?style=flat-square"> <img src="https://img.shields.io/badge/Deployment-Render-4e0115?style=flat-square">

---

## System Architecture

```
The End → Users → Frontend → Backend → Database
```

---

## Installation

```bash
git clone https://github.com/emilymontec/the-end.git; cd the-end
```

Clone the repository on your computer and navigate to the project directory.

### Set environment variables

Create a `.env` file in the directory `backend` and `frontend` in the project and add the following variables:

```bash
# .env backend
SUPABASE_DB_URL=SUPABASE_DB_URL
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=4000
```

```bash
# .env frontend
VITE_API_URL=http://localhost:4000
```

### Configure backend

Install backend dependencies
```bash
cd backend
npm install
```

### Configure frontend

Install frontend dependencies
```bash
cd frontend
npm install
```
<sub>You can open a new terminal or put the command `cd ../frontend` in the same terminal.</sub>

### Configure the database

Run the SQL script:
```bash
psql -U your_username -d your_database_name -f entitys.sql
```

### Execute

```bash
npm install
npm start
```

> The app will be available at: http://localhost:5173

---

## File Structure
```bash
   Parkplatz
      │
      ├── frontend/
      │   ├── src/                  # Código fuente del frontend
      │   │    ├── components/      # Componentes React
      │   │    ├── pages/           # Páginas React
      │   │    ├── api.js
      │   │    ├── App.css
      │   │    ├── App.jsx
      │   │    ├── index.css
      │   │    └── main.jsx
      │   ├── public/               # Archivos estáticos
      │   ├── dist/                 # Build de producción (generado)
      │   ├── .env                  # Variables de entorno (NO subir a GitHub)
      │   ├── .gitignore
      │   ├── eslint.config.js
      │   ├── index.html
      │   ├── package.json
      │   ├── README.md
      │   └── vite.config.js
      │
      ├── backend/
      │   └── src/
      │        ├── config/
      │        │      └── db.js          # Configuración de Supabase
      │        └── routes/
      │        │      ├── categorias.js
      │        │      ├── movies.js
      │        │      ├── salas.js
      │        │      ├── showtimes.js
      │        │      ├── tickets.js
      │        │      ├── uploads.js
      │        │      └── users.js
      │        ├── index.js               # Punto de entrada del servidor
      │        ├──.env                  # Variables de entorno (NO subir a GitHub)
      │        └── package.json
      ├── README.md
      ├── LICENSE
      └── entitys.sql
```

---

## License

This project is licensed under the **[ISC License](./LICENSE)**. See the file for more information.

---

<p align="center">
  <strong>The system is not deployed.</strong>
</p>
