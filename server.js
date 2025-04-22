// server.js
// A simple Express.js backend for a Todo list API

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to inlcude static content from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// In-memory array to store todo items
let todos = [];
let nextId = 1;

// Set up database
const db = new sqlite3.Database('todos.db', (err) => {
  if (err) {
    console.log('Could not open database');
  } else {
    console.log('Connected to the database');
  }
})

// serve index.html from 'public' at the '/' path
app.get('/', (req, res) => {
  res.sendFile('index.html');
})

// Creating the todos table
db.run(`
    Create TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    priority TEXT DEFAULT 'low',
    isComplete INTEGER DEFAULT 0,
    isFun INTEGER DEFAULT 0
    )
  `, (err) => {
  if (err) {
    console.log('Could not create table')
  } else {
    console.log('Todos table created')
  }
});

// GET all todo items at the '/todos' path
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving todos' });
    }
    res.json(rows);
  });
});

// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving todo' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Todo item not found' });
    }
    res.json(row);
  });
});

// POST a new todo item
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const query = `INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, 0, ?)`;
  db.run(query, [name, priority, isFun], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error creating todo' });
    }

    const newTodo = {
      id: this.lastID,
      name,
      priority,
      isComplete: 0,
      isFun
    };

    fs.writeFile('todo.log', JSON.stringify(newTodo), (err) => {
      if (err) console.error('Could not write to log file');
    });

    res.status(201).json(newTodo);
  });
});

// DELETE a todo item by ID
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting todo' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Todo item not found' });
    }
    res.json({ message: `Todo item ${id} deleted.` });
  });
});

// Start the server
// Start the server by listening on the specified PORT
app.listen(PORT, () => {
  console.log('Todo API server running');
})