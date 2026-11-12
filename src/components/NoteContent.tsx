type NoteContentProps = {
  author: string;
  text: string;
};

function NoteContent({ author, text }: NoteContentProps) {
  return (
    <div className="note-content">
      <div className="note-author">
        From: <span className="note-author-name">{author}</span>
      </div>
      <div className="note-text">Note: {text}</div>
    </div>
  );
}

export default NoteContent;
