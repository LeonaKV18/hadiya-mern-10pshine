import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNotes, createNote, trashNote, searchNotes, updateNote, togglePin } from '../api/notes';
import { getFolders } from '../api/folders';
import Sidebar from '../components/layout/Sidebar';
import NoteCard from '../components/notes/NoteCard';
import Button from '../components/ui/Button';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFolder = searchParams.get('folder') ? parseInt(searchParams.get('folder'), 10) : null;

  const setSelectedFolder = (id) => {
    if (id) {
      setSearchParams({ folder: id });
    } else {
      setSearchParams({});
    }
  };

  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNoteIds, setSelectedNoteIds] = useState(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const res = await getNotes();
      setNotes(res.data.notes || []);
    } catch {
      toast.error('Failed to load notes.');
    }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const res = await getFolders();
      setFolders(res.data.folders || []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    Promise.all([loadNotes(), loadFolders()]).finally(() => setIsLoading(false));
  }, [loadNotes, loadFolders]);

  const handleCreateNote = async () => {
    setIsCreating(true);
    try {
      const res = await createNote('Untitled', '', selectedFolder);
      navigate(`/notes/${res.data.note.id}`, { state: { fromFolder: selectedFolder } });
    } catch {
      toast.error('Failed to create note.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrash = async (id) => {
    try {
      await trashNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Note moved to trash.');
    } catch {
      toast.error('Failed to trash note.');
    }
  };

  const handlePin = async (id) => {
    try {
      await togglePin(id);
      await loadNotes();
    } catch {
      toast.error('Failed to pin note.');
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (!q.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await searchNotes(q);
      setSearchResults(res.data.notes || []);
    } catch {
      setSearchResults([]);
    }
  };

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkTrash = async () => {
    try {
      await Promise.all([...selectedNoteIds].map((id) => trashNote(id)));
      setNotes((prev) => prev.filter((n) => !selectedNoteIds.has(n.id)));
      setSelectedNoteIds(new Set());
      toast.success('Notes moved to trash.');
    } catch {
      toast.error('Failed to trash some notes.');
    }
  };

  const handleBulkMove = async (folderId) => {
    try {
      const promises = [...selectedNoteIds].map(async (id) => {
        const note = notes.find((n) => n.id === id);
        return updateNote(id, note.title, note.content, folderId);
      });
      await Promise.all(promises);
      await loadNotes();
      setSelectedNoteIds(new Set());
      toast.success('Notes moved.');
    } catch {
      toast.error('Failed to move some notes.');
    }
  };

  const displayedNotes = searchResults !== null
    ? searchResults
    : selectedFolder
    ? notes.filter((n) => n.folder_id === selectedFolder)
    : notes;

  const pinnedNotes = displayedNotes.filter((n) => n.is_pinned);
  const otherNotes = displayedNotes.filter((n) => !n.is_pinned);

  const allSelected =
    displayedNotes.length > 0 && displayedNotes.every((n) => selectedNoteIds.has(n.id));

  const toggleSelectAll = () => {
    setSelectedNoteIds((prev) => {
      const everySelected =
        displayedNotes.length > 0 && displayedNotes.every((n) => prev.has(n.id));
      if (everySelected) return new Set();
      return new Set(displayedNotes.map((n) => n.id));
    });
  };

  // Renders a single card wrapped with its selection checkbox
  const renderCard = (note) => (
    <div key={note.id} className={styles.noteCardWrapper}>
      <input
        type="checkbox"
        className={styles.noteCheckbox}
        checked={selectedNoteIds.has(note.id)}
        onChange={(e) => toggleSelect(e, note.id)}
        onClick={(e) => e.stopPropagation()}
      />
      <NoteCard
        note={note}
        onTrash={handleTrash}
        onPin={handlePin}
        folders={folders}
        onMoved={loadNotes}
        folderName={
          !selectedFolder && note.folder_id
            ? folders.find((f) => f.id === note.folder_id)?.name
            : undefined
        }
      />
    </div>
  );

  return (
    <div className={styles.layout}>
      <Sidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onFolderSelect={(id) => {
          setSelectedFolder(selectedFolder === id ? null : id);
          setSearchQuery('');
          setSearchResults(null);
        }}
        onFolderCreated={loadFolders}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>◎</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <Button onClick={handleCreateNote} isLoading={isCreating}>
            + New Note
          </Button>
        </header>

        {/* Notes area */}
        <div className={styles.content}>
          {selectedNoteIds.size > 0 && (
            <div className={styles.bulkBar}>
              <button className={styles.selectAllBtn} onClick={toggleSelectAll}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <span className={styles.bulkCount}>
                {selectedNoteIds.size > 0 ? `${selectedNoteIds.size} selected` : ''}
              </span>
              {selectedNoteIds.size > 0 && (
                <>
                  <button className={styles.bulkBtn} onClick={handleBulkTrash}>Move to Trash</button>
                  {folders.length > 0 && (
                    <select
                      className={styles.bulkSelect}
                      defaultValue=""
                      onChange={(e) => {
                        const val = e.target.value;
                        handleBulkMove(val === '' ? null : parseInt(val, 10));
                        e.target.value = '';
                      }}
                    >
                      <option value="" disabled>Move to folder...</option>
                      <option value="">All Notes (no folder)</option>
                      {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                  <button className={styles.bulkBtn} onClick={() => setSelectedNoteIds(new Set())}>Clear</button>
                </>
              )}
            </div>
          )}

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {searchResults !== null
                ? `Results for "${searchQuery}"`
                : selectedFolder
                ? folders.find((f) => f.id === selectedFolder)?.name || 'Folder'
                : 'All Notes'}
            </h2>
            <span className={styles.noteCount}>{displayedNotes.length} notes</span>
          </div>

          {isLoading ? (
            <div className={styles.loadingGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>✦</div>
              <p className={styles.emptyTitle}>
                {searchResults !== null ? 'No notes match your search.' : 'No notes yet.'}
              </p>
              {searchResults === null && (
                <p className={styles.emptyHint}>Click "New Note" to get started.</p>
              )}
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <>
                  <h3 className={styles.subSectionTitle}>Pinned</h3>
                  <div className={styles.grid}>{pinnedNotes.map(renderCard)}</div>
                  {otherNotes.length > 0 && <h3 className={styles.subSectionTitle}>Others</h3>}
                </>
              )}
              <div className={styles.grid}>{otherNotes.map(renderCard)}</div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;