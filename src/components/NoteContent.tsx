type NoteContentProps = {
  author: string;
  text: string;
};

function NoteContent({ author, text }: NoteContentProps) {
  return (
    <div className="note-content">
      <div className="note-author">от: {author}</div>
      <div className="note-text">{text}</div>
    </div>
  );
}

export default NoteContent;
