import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getTrashedNotes, restoreNote, permanentlyDeleteNote } from '../api/notes';
import Sidebar from '../components/layout/Sidebar';
import { getFolders } from '../api/folders';
import Button from '../components/ui/Button';
import styles from './TrashPage.module.css';

const TrashPage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [trashRes, folderRes] = await Promise.all([getTrashedNotes(), getFolders()]);
      setNotes(trashRes.data.notes || []);
      setFolders(folderRes.data.folders || []);
    } catch {
      toast.error('Failed to load trash.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRestore = async (id) => {
    try {
      await restoreNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Note restored.');
    } catch {
      toast.error('Failed to restore note.');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this note? This cannot be undone.')) return;
    try {
      await permanentlyDeleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Note permanently deleted.');
    } catch {
      toast.error('Failed to delete note.');
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        folders={folders}
        selectedFolder={null}
        onFolderSelect={() => navigate('/dashboard')}
        onFolderCreated={load}
      />

      <main className={styles.main}>
        <header className={styles.topBar}>
          <h1 className={styles.heading}>Trash</h1>
        </header>

        <div className={styles.content}>
          {isLoading ? (
            <p className={styles.hint}>Loading...</p>
          ) : notes.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>⊘</span>
              <p>Trash is empty.</p>
            </div>
          ) : (
            <div className={styles.list}>
              {notes.map((note) => (
                <div key={note.id} className={styles.trashItem}>
                  <div className={styles.trashInfo}>
                    <h3 className={styles.trashTitle}>{note.title || 'Untitled'}</h3>
                    <span className={styles.trashDate}>
                      Deleted {new Date(note.deleted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.trashActions}>
                    <Button variant="secondary" size="sm" onClick={() => handleRestore(note.id)}>
                      Restore
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handlePermanentDelete(note.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrashPage;