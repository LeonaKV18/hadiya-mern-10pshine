import React, { useState, useEffect, useReducer } from 'react';
import styles from './EditorToolbar.module.css';

const ToolbarButton = ({ onClick, isActive, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={[styles.toolBtn, isActive ? styles.active : ''].join(' ')}
    title={title}
  >
    {children}
  </button>
);

// Standard word-processor font sizes
const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Lora', value: "'Lora', serif" },
];

// Adds a protocol to bare URLs so links stay absolute instead of being treated
// as in-app relative paths (which produced /notes/google.com).
const normalizeUrl = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const EditorToolbar = ({ editor }) => {
  // Holds the active dialog: { type: 'link' | 'image', value: string } or null
  const [modal, setModal] = useState(null);
  // Forces a re-render whenever the editor selection/state changes so that
  // active states and the in-table button group stay in sync.
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => forceUpdate();
    editor.on('transaction', update);
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor) return null;

  const currentSize = (editor.getAttributes('textStyle').fontSize || '').replace('px', '');
  const currentFamily = editor.getAttributes('textStyle').fontFamily || '';
  const currentColor = editor.getAttributes('textStyle').color || '#2C1A2B';

  const setFontSize = (value) => {
    if (!value) {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(`${value}px`).run();
    }
  };

  const setFontFamily = (value) => {
    if (!value) {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(value).run();
    }
  };

  // Opens the in-app link dialog, prefilled with any existing link href
  const openLinkModal = () => {
    const previous = editor.getAttributes('link').href || '';
    setModal({ type: 'link', value: previous });
  };

  const openImageModal = () => setModal({ type: 'image', value: '' });

  const closeModal = () => setModal(null);

  const submitModal = () => {
    if (!modal) return;

    if (modal.type === 'link') {
      const href = normalizeUrl(modal.value);
      if (!href) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      }
    }

    if (modal.type === 'image') {
      const src = modal.value.trim();
      if (src) editor.chain().focus().setImage({ src }).run();
    }

    setModal(null);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setModal(null);
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const inTable = editor.isActive('table');

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <select
          className={styles.select}
          value={currentFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          title="Font family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          className={styles.selectSmall}
          value={currentSize}
          onChange={(e) => setFontSize(e.target.value)}
          title="Font size"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript">
          x²
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript">
          x₂
        </ToolbarButton>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <label className={styles.colorLabel} title="Text color">
          <span className={styles.colorGlyph}>A</span>
          <input
            type="color"
            className={styles.colorInput}
            value={currentColor}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <ToolbarButton onClick={() => editor.chain().focus().unsetColor().run()} title="Reset text color">
          A✕
        </ToolbarButton>

        <label className={styles.colorLabel} title="Highlight color">
          <span className={styles.highlightGlyph}>H</span>
          <input
            type="color"
            className={styles.colorInput}
            onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
          />
        </label>
        <ToolbarButton onClick={() => editor.chain().focus().unsetHighlight().run()} title="Remove highlight">
          H✕
        </ToolbarButton>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarButton>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align left">⇤</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align center">↔</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align right">⇥</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">≣</ToolbarButton>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">≡</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered list">1.</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">❝</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline code">{'</>'}</ToolbarButton>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <ToolbarButton onClick={openLinkModal} isActive={editor.isActive('link')} title="Insert / edit link">🔗</ToolbarButton>
        <ToolbarButton onClick={openImageModal} title="Insert image by URL">🖼</ToolbarButton>
        <ToolbarButton onClick={insertTable} title="Insert table">▦</ToolbarButton>
      </div>

      {inTable && (
        <>
          <div className={styles.divider} />
          <div className={styles.group}>
            <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column">+Col</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">−Col</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row">+Row</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">−Row</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">✕Tbl</ToolbarButton>
          </div>
        </>
      )}

      <div className={styles.divider} />

      <div className={styles.group}>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolbarButton>
      </div>

      {modal && (
        <div className={styles.modalOverlay} onMouseDown={closeModal}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {modal.type === 'link' ? 'Insert link' : 'Insert image'}
            </h3>
            <input
              className={styles.modalInput}
              type="text"
              autoFocus
              placeholder={modal.type === 'link' ? 'example.com' : 'https://example.com/image.png'}
              value={modal.value}
              onChange={(e) => setModal((m) => ({ ...m, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitModal();
                if (e.key === 'Escape') closeModal();
              }}
            />
            <div className={styles.modalActions}>
              {modal.type === 'link' && editor.isActive('link') && (
                <button className={styles.modalRemove} type="button" onClick={removeLink}>
                  Remove link
                </button>
              )}
              <button className={styles.modalCancel} type="button" onClick={closeModal}>Cancel</button>
              <button className={styles.modalConfirm} type="button" onClick={submitModal}>
                {modal.type === 'link' ? 'Apply' : 'Insert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorToolbar;