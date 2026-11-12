import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Note = {
  id: number;
  author: string;
  text: string;
  pos_x: number;
  pos_y: number;
};

const app = express();
const port = Number(process.env.PORT ?? 3000);

// Разрешаем сайту, который запущен на другом адресе, обращаться к API.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

// Файл базы находится рядом с этим серверным исходным файлом.
const serverFolder = dirname(fileURLToPath(import.meta.url));
const databasePath = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'notes.sqlite')
  : join(serverFolder, '..', 'notes.sqlite');
const database = new DatabaseSync(databasePath);

// CREATE TABLE IF NOT EXISTS создаёт таблицу при первом запуске,
// а при последующих запусках оставляет уже сохранённые данные.
database.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL DEFAULT 'Неизвестно',
    text TEXT NOT NULL,
    pos_x REAL NOT NULL,
    pos_y REAL NOT NULL
  )
`);

// Добавляем поле к уже существующей таблице, созданной до появления автора.
const noteColumns = database.prepare('PRAGMA table_info(notes)').all() as {
  name: string;
}[];
if (!noteColumns.some((column) => column.name === 'author')) {
  database.exec(
    "ALTER TABLE notes ADD COLUMN author TEXT NOT NULL DEFAULT 'Неизвестно'",
  );
}

const getNotes = database.prepare(
  'SELECT id, author, text, pos_x, pos_y FROM notes ORDER BY id',
);
const createNote = database.prepare(
  'INSERT INTO notes (author, text, pos_x, pos_y) VALUES (?, ?, ?, ?)',
);
const moveNote = database.prepare(
  'UPDATE notes SET pos_x = ?, pos_y = ? WHERE id = ?',
);
const deleteNote = database.prepare('DELETE FROM notes WHERE id = ?');

app.get('/notes', (_req, res) => {
  res.json(getNotes.all() as Note[]);
});

app.post('/notes', (req, res) => {
  const { author, text, pos_x, pos_y } = req.body as Partial<Note>;

  if (
    typeof author !== 'string' ||
    author.trim().length === 0 ||
    typeof text !== 'string' ||
    text.trim().length === 0 ||
    typeof pos_x !== 'number' ||
    typeof pos_y !== 'number'
  ) {
    res.status(400).json({
      error: 'Нужны имя автора, текст и числовые координаты заметки.',
    });
    return;
  }

  const result = createNote.run(author.trim(), text.trim(), pos_x, pos_y);
  const note: Note = {
    id: Number(result.lastInsertRowid),
    author: author.trim(),
    text: text.trim(),
    pos_x,
    pos_y,
  };

  res.status(201).json(note);
});

app.patch('/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const { pos_x, pos_y } = req.body as Partial<Note>;

  if (
    !Number.isInteger(id) ||
    typeof pos_x !== 'number' ||
    typeof pos_y !== 'number'
  ) {
    res.status(400).json({ error: 'Нужны ID и новые числовые координаты.' });
    return;
  }

  const result = moveNote.run(pos_x, pos_y, id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Заметка не найдена.' });
    return;
  }

  res.sendStatus(204);
});

app.delete('/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Некорректный ID заметки.' });
    return;
  }

  const result = deleteNote.run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Заметка не найдена.' });
    return;
  }

  res.sendStatus(204);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
});
