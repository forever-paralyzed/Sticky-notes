import type { Note } from '../types';
import '.././styles/Note.css';
import { useState, type PointerEvent } from 'react';

type TodoItemProps = {
  note: Note;
  onMove: (
    id: number,
    pos_x: number,
    pos_y: number,
    cursorX: number,
    cursorY: number,
  ) => void;
  onDrag: (cursorX: number, cursorY: number) => void;
};

function TodoItem({ note, onMove, onDrag }: TodoItemProps) {
  const [pos, setPos] = useState({ pos_x: note.pos_x, pos_y: note.pos_y });

  const [grab, setGrab] = useState<{ pos_x: number; pos_y: number } | null>(
    null,
  );

  function handleDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setGrab({ pos_x: e.clientX - pos.pos_x, pos_y: e.clientY - pos.pos_y });
  }

  function handleUp(e: PointerEvent<HTMLDivElement>) {
    if (grab === null) {
      return;
    }
    setGrab(null);
    onMove(note.id, pos.pos_x, pos.pos_y, e.clientX, e.clientY);
  }

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (grab === null) {
      return;
    }

    const newX = e.clientX - grab.pos_x;
    const newY = e.clientY - grab.pos_y;

    const maxX = window.innerWidth - e.currentTarget.offsetWidth;
    const maxY = window.innerHeight - e.currentTarget.offsetHeight;

    setPos({
      pos_x: Math.max(0, Math.min(newX, maxX)),
      pos_y: Math.max(0, Math.min(newY, maxY)),
    });
    onDrag(e.clientX, e.clientY);
  }

  return (
    <div
      className="note"
      style={{ left: pos.pos_x, top: pos.pos_y }}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerMove={handleMove}
    >
      {note.text}
    </div>
  );
}

export default TodoItem;
