import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import toast from 'react-hot-toast';
import {
  getNoteById,
  updateNote,
  autosaveNote,
  summarizeNote,
  exportNote,
} from '../api/notes';
import EditorToolbar from '../components/editor/EditorToolbar';
import Button from '../components/ui/Button';
import styles from './NoteEditorPage.module.css';

const AUTOSAVE_DELAY_MS = 2000;

const NoteEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const autosaveTimer = useRef(null);
  const lastSavedContent = useRef('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '',
    onUpdate: ({ editor: ed }) => {
      // Trigger autosave after user stops typing for AUTOSAVE_DELAY_MS
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        const html = ed.getHTML();
        if (html !== lastSavedContent.current) {
          handleAutosave(html);
        }
      }, AUTOSAVE_DELAY_MS);
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getNoteById(id);
        const n = res.data.note;
        setNote(n);
        setTitle(n.title);
        editor?.commands.setContent(n.content || '');
        lastSavedContent.current = n.content || '';
      } catch {
        toast.error('Note not found.');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (editor) load();
  }, [id, editor, navigate]);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => clearTimeout(autosaveTimer.current);
  }, []);

  const handleAutosave = useCallback(
    async (content) => {
      try {
        await autosaveNote(id, content);
        lastSavedContent.current = content;
      } catch {
        // Silent autosave failure - user can still manually save
      }
    },
    [id]
  );

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Note must have a title.');
      return;
    }

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      await updateNote(id, title, content);
      lastSavedContent.current = content;
      toast.success('Note saved.');
    } catch {
      toast.error('Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const res = await summarizeNote(id);
      setSummary(res.data.summary);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate summary.';
      toast.error(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const res = await exportNote(id, format);
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'note'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(`Failed to export as ${format.toUpperCase()}.`);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Editor header bar */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <input
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
        />

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={handleSummarize} isLoading={isSummarizing}>
            ✦ Summarize
          </Button>

          <div className={styles.exportMenu}>
            <Button variant="ghost" size="sm" onClick={() => handleExport('pdf')}>
              Export PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('docx')}>
              Export DOCX
            </Button>
          </div>

          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className={styles.editorWrapper}>
        <EditorContent editor={editor} className={styles.editor} />
      </div>

      {/* AI Summary panel */}
      {summary && (
        <div className={styles.summaryPanel}>
          <div className={styles.summaryHeader}>
            <span>✦ AI Summary</span>
            <button onClick={() => setSummary(null)} className={styles.closeBtn}>✕</button>
          </div>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default NoteEditorPage;