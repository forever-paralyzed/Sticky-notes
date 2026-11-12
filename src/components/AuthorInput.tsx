type AuthorInputProps = {
  value: string;
  onChange: (value: string) => void;
};

function AuthorInput({ value, onChange }: AuthorInputProps) {
  return (
    <label className="author-input">
      <span>От кого?</span>
      <input
        type="text"
        name="author"
        placeholder="Введи имя"
        value={value}
        aria-required="true"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default AuthorInput;
