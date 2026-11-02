import { Copy, Download } from 'lucide-react';
import { Button } from './Button';
import { useToast } from './Toast';
import { copyText, downloadText } from '../lib/io';

export function DocumentPreview({
  content,
  filename,
  emptyLabel = 'Nothing to preview yet. Start filling in the form.',
}: {
  content: string;
  filename: string;
  emptyLabel?: string;
}) {
  const { notify } = useToast();
  const hasContent = content.trim().length > 0;

  const handleCopy = async () => {
    const ok = await copyText(content);
    if (ok) notify('Copied to clipboard.');
    else notify('Copy failed. Select the text and copy it manually.', 'error');
  };

  const handleDownload = () => {
    downloadText(filename, content, 'text/markdown;charset=utf-8');
    notify(`Downloaded ${filename}.`);
  };

  return (
    <div className="preview">
      <div className="preview__head">
        <div>
          <h2 className="preview__title">Document preview</h2>
          <p className="preview__hint">Exactly what you will copy or export.</p>
        </div>
        <div className="preview__actions">
          <Button size="sm" icon={<Copy size={14} />} onClick={handleCopy} disabled={!hasContent}>
            Copy
          </Button>
          <Button
            size="sm"
            icon={<Download size={14} />}
            onClick={handleDownload}
            disabled={!hasContent}
          >
            Markdown
          </Button>
        </div>
      </div>
      <pre className="preview__code" aria-label="Document preview">
        {hasContent ? content : emptyLabel}
      </pre>
    </div>
  );
}
