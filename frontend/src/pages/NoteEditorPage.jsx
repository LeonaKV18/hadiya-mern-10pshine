import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle, FontSize, Color, FontFamily } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
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
import { RobotIcon } from '../components/ui/Icons';
import styles from './NoteEditorPage.module.css';

const AUTOSAVE_DELAY_MS = 2000;

const NoteEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromFolder = location.state?.fromFolder;

  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const autosaveTimer = useRef(null);
  const lastSaved = useRef({ title: '', content: '' });
  const titleRef = useRef('');
  const pendingContent = useRef(null);
  const contentApplied = useRef(false);
  // Holds the live editor instance so the debounced save never reads a stale
  // (null) editor captured from the first render's closure.
  const editorRef = useRef(null);

  // Debounced save of both title and content
  const scheduleSave = useCallback(() => {
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const ed = editorRef.current;
      if (!ed || ed.isDestroyed) return;
      const content = ed.getHTML();
      const currentTitle = titleRef.current;
      if (content === lastSaved.current.content && currentTitle === lastSaved.current.title) {
        return;
      }
      try {
        await autosaveNote(id, { title: currentTitle, content });
        lastSaved.current = { title: currentTitle, content };
      } catch {
        // Silent autosave failure - manual save still available
      }
    }, AUTOSAVE_DELAY_MS);
  }, [id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false,
        link: { openOnClick: false, autolink: true },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      Image.configure({ inline: false, allowBase64: true }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onUpdate: () => {
      if (!contentApplied.current) return;
      scheduleSave();
    },
  });

  // Keep the ref pointed at the current editor instance
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    let cancelled = false;
    contentApplied.current = false;

    const load = async () => {
      try {
        const res = await getNoteById(id);
        if (cancelled) return;
        const n = res.data.note;
        setTitle(n.title);
        titleRef.current = n.title || '';
        pendingContent.current = n.content || '';
        lastSaved.current = { title: n.title || '', content: n.content || '' };
      } catch {
        if (cancelled) return;
        toast.error('Note not found.');
        navigate('/dashboard');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (pendingContent.current === null) return;
    editor.commands.setContent(pendingContent.current);
    contentApplied.current = true;
  }, [editor, isLoading]);

  useEffect(() => {
    return () => clearTimeout(autosaveTimer.current);
  }, []);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    titleRef.current = value;
    if (contentApplied.current) scheduleSave();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Note must have a title.');
      return;
    }

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      await updateNote(id, title, content);
      lastSaved.current = { title, content };
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

  const handleExportPdf = async () => {
    try {
      const res = await exportNote(id, 'pdf');
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'note'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export as PDF.');
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
        <button
          className={styles.backBtn}
          onClick={() => {
            if (fromFolder) {
              navigate(`/dashboard?folder=${fromFolder}`);
            } else {
              navigate('/dashboard');
            }
          }}
        >
          ← Back
        </button>

        <input
          className={styles.titleInput}
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title..."
        />

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={handleSummarize} isLoading={isSummarizing}>
            <span className={styles.aiButtonLabel}>
              <RobotIcon size={15} />
              Summarize
            </span>
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExportPdf}>
            Export PDF
          </Button>

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
            <span className={styles.summaryTitle}>
              <RobotIcon size={15} />
              AI Summary
            </span>
            <button onClick={() => setSummary(null)} className={styles.closeBtn}>✕</button>
          </div>
          <p className={styles.summaryText}>{summary}</p>
        </div>
      )}
    </div>
  );
};

export default NoteEditorPage;