import { type SubmitEvent, useState, useEffect, useRef } from 'react';
import type { Note } from './types';
import './styles/App.css';
import TodoItem from './components/TodoItem';
import './styles/Note.css';
import './styles/TrashCan.css';
import penImage from './assets/pen.png';
import trashCan from './assets/trashCan.png';

function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('notes');
    if (saved === null) {
      return [];
    }

    return JSON.parse(saved) as Note[];
  });
  const [input, setInput] = useState('');
  const trashRef = useRef<HTMLDivElement>(null);
  const [overTrash, setOverTrash] = useState(false);

  function onDrag(cursorX: number, cursorY: number) {
    setOverTrash(isOverTrash(cursorX, cursorY));
  }
  function onAdd() {
    if (input.trim().length === 0) {
      return;
    }

    setNotes((currentNotes) => [
      ...currentNotes,
      {
        id: Date.now(),
        text: input.trim(),
        pos_x: 100 + currentNotes.length * 15,
        pos_y: 100 + currentNotes.length * 15,
      },
    ]);
    setInput('');
  }

  function onMove(
    id: number,
    x: number,
    y: number,
    cursorX: number,
    cursorY: number,
  ) {
    setOverTrash(false);
    if (trashRef.current === null) {
      return;
    }
    const rect = trashRef.current.getBoundingClientRect();
    console.log('курсор', cursorX, cursorY, 'корзина', rect);
    const overTrash =
      cursorX > rect.left &&
      cursorX < rect.right &&
      cursorY > rect.top &&
      cursorY < rect.bottom;

    if (overTrash) {
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
    } else {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === id ? { ...note, pos_x: x, pos_y: y } : note,
        ),
      );
    }
  }

  useEffect(() => {
    //запись данных в хранилище при изминении todos
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  function isOverTrash(cursorX: number, cursorY: number) {
    if (trashRef.current === null) {
      return false;
    }
    const rect = trashRef.current.getBoundingClientRect();

    return (
      cursorX > rect.left &&
      cursorX < rect.right &&
      cursorY > rect.top &&
      cursorY < rect.bottom
    );
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    onAdd();
    setInput('');
  }
  return (
    <div>
      <form className="note-input" onSubmit={handleSubmit}>
        <input
          placeholder="add new sticky note"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
