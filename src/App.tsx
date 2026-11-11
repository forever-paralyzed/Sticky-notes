import { type SubmitEvent, useState, useEffect, useRef } from 'react';
import type { Note } from './types';
import './styles/App.css';
import TodoItem from './components/TodoItem';
import './styles/Note.css';
import './styles/TrashCan.css';
import penImage from './assets/pen.png';
import trashCan from './assets/trashCan.png';

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const trashRef = useRef<HTMLDivElement>(null);
  const [overTrash, setOverTrash] = useState(false);
  const [hint, setHint] = useState('');

  function onDrag(noteRect: DOMRect) {
    setOverTrash(isTouchingTrash(noteRect));
  }
  // При запуске с другого компьютера браузер обращается к серверу
  // на том же устройстве, с которого загружен сайт.
  const apiUrl =
    import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

  async function loadNotes() {
    const response = await fetch(`${apiUrl}/notes`);
    if (!response.ok) {
      throw new Error('Не удалось загрузить заметки с сервера.');
    }
    const serverNotes = (await response.json()) as Note[];
    setNotes(serverNotes);
  }

  useEffect(() => {
    let isActive = true;

    async function refreshNotes() {
      try {
        const response = await fetch(`${apiUrl}/notes`);
        if (!response.ok) {
          throw new Error('Сервер не ответил успешно.');
        }
        const serverNotes = (await response.json()) as Note[];
        if (isActive) {
          setNotes(serverNotes);
          setHint('');
        }
      } catch {
        if (isActive) {
          setHint('Нет связи с сервером. Запусти sticky-server.');
        }
      }
    }

    void refreshNotes();
    const intervalId = window.setInterval(() => void refreshNotes(), 2000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [apiUrl]);

  async function onAdd() {
    if (input.trim().length === 0) {
      setHint('Сначала введи название!');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input.trim(),
          pos_x: 100 + notes.length * 15,
          pos_y: 100 + notes.length * 15,
        }),
      });
      if (!response.ok) {
        throw new Error('Сервер не сохранил заметку.');
      }
      const createdNote = (await response.json()) as Note;
      setNotes((currentNotes) => [...currentNotes, createdNote]);
      setInput('');
      setHint('');
    } catch {
      setHint('Не удалось сохранить заметку. Проверь, запущен ли сервер.');
    }
  }

  function onMove(
    id: number,
    x: number,
    y: number,
    noteRect: DOMRect,
  ) {
    setOverTrash(false);
    if (trashRef.current === null) {
      return;
    }
    const overTrash = isTouchingTrash(noteRect);

    if (overTrash) {
      void fetch(`${apiUrl}/notes/${id}`, { method: 'DELETE' })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Сервер не удалил заметку.');
          }
          await loadNotes();
        })
        .catch(() => setHint('Не удалось удалить заметку.'));
    } else {
      void fetch(`${apiUrl}/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pos_x: x, pos_y: y }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Сервер не переместил заметку.');
          }
          await loadNotes();
        })
        .catch(() => setHint('Не удалось переместить заметку.'));
    }
  }

  function isTouchingTrash(noteRect: DOMRect) {
    if (trashRef.current === null) {
      return false;
    }
    const trashRect = trashRef.current.getBoundingClientRect();

    return (
      noteRect.left <= trashRect.right &&
      noteRect.right >= trashRect.left &&
      noteRect.top <= trashRect.bottom &&
      noteRect.bottom >= trashRect.top
    );
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    onAdd();
  }
  return (
    <div>
      <form className="note-input" onSubmit={handleSubmit}>
        {hint && <p className="note-hint">{hint}</p>}
        <input
          placeholder="add new sticky note"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHint('');
          }}
        />
        <button className="note-btn">add</button>
        <img src={penImage} alt="pen" className="pen-input" />
      </form>
      <div
        className={overTrash ? 'trash trash-active' : 'trash'}
        ref={trashRef}
      >
        <img src={trashCan} alt="TrashCan" className="trashCan" />
      </div>
      <div className="board">
        {notes.map((note) => (
          <TodoItem key={note.id} note={note} onMove={onMove} onDrag={onDrag} />
        ))}
      </div>
    </div>
  );
}

export default App;
