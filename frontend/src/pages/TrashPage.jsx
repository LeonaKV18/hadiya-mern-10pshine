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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Note restored.');
    } catch {
      toast.error('Failed to restore note.');
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirmDeleteId) return;

    if (confirmDeleteId === 'bulk') {
      await handleBulkDeleteConfirmed();
      return;
    }

    try {
      await permanentlyDeleteNote(confirmDeleteId);
      setNotes((prev) => prev.filter((n) => n.id !== confirmDeleteId));
      toast.success('Note permanently deleted.');
    } catch {
      toast.error('Failed to delete note.');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = notes.length > 0 && notes.every((n) => selectedIds.has(n.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const everySelected = notes.length > 0 && notes.every((n) => prev.has(n.id));
      if (everySelected) return new Set();
      return new Set(notes.map((n) => n.id));
    });
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all([...selectedIds].map((id) => restoreNote(id)));
      setNotes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
      toast.success('Notes restored.');
    } catch {
      toast.error('Failed to restore some notes.');
    }
  };

  const handleBulkDelete = () => {
    setConfirmDeleteId('bulk');
  };

  const handleBulkDeleteConfirmed = async () => {
    setConfirmDeleteId(null);
    try {
      await Promise.all([...selectedIds].map((id) => permanentlyDeleteNote(id)));
      setNotes((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
      toast.success('Notes permanently deleted.');
    } catch {
      toast.error('Failed to delete some notes.');
    }
  };

  let trashBody;
  if (isLoading) {
    trashBody = <p className={styles.hint}>Loading...</p>;
  } else if (notes.length === 0) {
    trashBody = (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>⊘</span>
        <p>Trash is empty.</p>
      </div>
    );
  } else {
    trashBody = (
      <>
        <div className={styles.bulkBar}>
          <button className={styles.selectAllBtn} onClick={toggleSelectAll}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <span className={styles.bulkCount}>
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : ''}
          </span>
          {selectedIds.size > 0 && (
            <>
              <button className={styles.bulkBtnSecondary} onClick={handleBulkRestore}>
                Restore selected
              </button>
              <button className={styles.bulkBtnDanger} onClick={handleBulkDelete}>
                Delete selected
              </button>
            </>
          )}
        </div>

        <div className={styles.list}>
          {notes.map((note) => (
            <div key={note.id} className={styles.trashItem}>
              <input
                type="checkbox"
                className={styles.trashCheckbox}
                checked={selectedIds.has(note.id)}
                onChange={() => toggleSelect(note.id)}
              />
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
                <Button variant="danger" size="sm" onClick={() => setConfirmDeleteId(note.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar
        folders={folders}
        selectedFolder={null}
        onFolderSelect={() => navigate('/dashboard')}
        onFolderCreated={load}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main className={styles.main}>
        <header className={styles.topBar}>
          <h1 className={styles.heading}>Trash</h1>
        </header>

        <div className={styles.content}>{trashBody}</div>
      </main>

      {confirmDeleteId && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>
              {confirmDeleteId === 'bulk'
                ? `Permanently delete ${selectedIds.size} notes?`
                : 'Permanently delete this note?'}
            </h3>
            <p className={styles.dialogBody}>This cannot be undone.</p>
            <div className={styles.dialogActions}>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handlePermanentDelete}>
                Delete permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashPage;