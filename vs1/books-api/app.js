const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'books.json');

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <h1>Books API</h1>
    <p>Available endpoints:</p>
    <ul>
      <li>GET /books - Get all books</li>
      <li>GET /books/available - Get available books</li>
      <li>POST /books - Add a new book</li>
      <li>PUT /books/:id - Update a book</li>
      <li>DELETE /books/:id - Delete a book</li>
    </ul>
  `);
});

async function readBooks() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
      return [];
    }
    throw error;
  }
}

async function writeBooks(books) {
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2));
}

app.get('/books', async (req, res) => {
  try {
    const books = await readBooks();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const books = await readBooks();
    const book = books.find(book => book.id === parseInt(id));
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

app.get('/books/available', async (req, res) => {
  try {
    const books = await readBooks();
    res.json(books.filter(book => book.available === true));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available books' });
  }
});

app.post('/books', async (req, res) => {
  try {
    const { title, author, available } = req.body;
    if (!title || !author || typeof available !== 'boolean') {
      return res.status(400).json({ error: 'Invalid book data' });
    }
    
    const books = await readBooks();
    const newBook = {
      id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
      title,
      author,
      available
    };
    
    books.push(newBook);
    await writeBooks(books);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add book' });
  }
});

app.put('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const books = await readBooks();
    const bookIndex = books.findIndex(b => b.id === parseInt(id));
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    books[bookIndex] = { ...books[bookIndex], ...req.body };
    await writeBooks(books);
    res.json(books[bookIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const books = await readBooks();
    const filteredBooks = books.filter(book => book.id !== parseInt(id));
    
    if (books.length === filteredBooks.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    await writeBooks(filteredBooks);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
