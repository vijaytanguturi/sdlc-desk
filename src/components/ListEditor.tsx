import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  hint?: string;
  addLabel?: string;
  rows?: number;
}

export function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  hint,
  addLabel = 'Add item',
  rows = 2,
}: ListEditorProps) {
  const update = (index: number, value: string) => {
    onChange(items.map((item, i) => (i === index ? value : item)));
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="list-editor">
      <div className="list-editor__heading">
        <span className="field__label">{label}</span>
        {hint ? <span className="list-editor__hint">{hint}</span> : null}
      </div>
      {items.length === 0 ? (
        <p className="list-editor__empty">Nothing added yet.</p>
      ) : (
        <ol className="list-editor__items">
          {items.map((item, index) => (
            <li className="list-editor__row" key={index}>
              <span className="list-editor__index" aria-hidden="true">
                {index + 1}
              </span>
              <textarea
                className="textarea list-editor__input"
                value={item}
                rows={rows}
                aria-label={`${label} item ${index + 1}`}
                placeholder={placeholder}
                onChange={(event) => update(index, event.target.value)}
              />
              <div className="list-editor__actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Move ${label} item ${index + 1} up`}
                  title={`Move ${label} item ${index + 1} up`}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Move ${label} item ${index + 1} down`}
                  title={`Move ${label} item ${index + 1} down`}
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  aria-label={`Remove ${label} item ${index + 1}`}
                  title={`Remove ${label} item ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div>
        <Button size="sm" icon={<Plus size={15} />} onClick={() => onChange([...items, ''])}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
