import type { Note } from '../types';
import '.././styles/Note.css';
import { useEffect, useState, type PointerEvent } from 'react';

type TodoItemProps = {
  note: Note;
  onMove: (
    id: number,
    pos_x: number,
    pos_y: number,
    noteRect: DOMRect,
  ) => void;
  onDrag: (noteRect: DOMRect) => void;
};

function TodoItem({ note, onMove, onDrag }: TodoItemProps) {
  const [pos, setPos] = useState({ pos_x: note.pos_x, pos_y: note.pos_y });

  // Если сервер сообщил новые координаты (например, после действия другого
  // пользователя), обновляем позицию, которую рисует этот компонент.
  useEffect(() => {
    setPos({ pos_x: note.pos_x, pos_y: note.pos_y });
  }, [note.pos_x, note.pos_y]);

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
    const noteRect = e.currentTarget.getBoundingClientRect();
    onMove(note.id, pos.pos_x, pos.pos_y, noteRect);
  }

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (grab === null) {
      return;
    }

    const newX = e.clientX - grab.pos_x;
    const newY = e.clientY - grab.pos_y;

    const maxX = window.innerWidth - e.currentTarget.offsetWidth;
    const maxY = window.innerHeight - e.currentTarget.offsetHeight;

    const nextX = Math.max(0, Math.min(newX, maxX));
    const nextY = Math.max(0, Math.min(newY, maxY));
    const currentRect = e.currentTarget.getBoundingClientRect();
    const nextRect = new DOMRect(
      currentRect.left + nextX - pos.pos_x,
      currentRect.top + nextY - pos.pos_y,
      currentRect.width,
      currentRect.height,
    );

    setPos({ pos_x: nextX, pos_y: nextY });
    onDrag(nextRect);
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
