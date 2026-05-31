import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNotes, createNote, trashNote, searchNotes } from '../api/notes';
import { getFolders } from '../api/folders';
import Sidebar from '../components/layout/Sidebar';
import NoteCard from '../components/notes/NoteCard';
import Button from '../components/ui/Button';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      // Non-critical - sidebar just shows empty
    }
  }, []);

  useEffect(() => {
    Promise.all([loadNotes(), loadFolders()]).finally(() => setIsLoading(false));
  }, [loadNotes, loadFolders]);

  const handleCreateNote = async () => {
    setIsCreating(true);
    try {
      const res = await createNote('Untitled', '', selectedFolder);
      navigate(`/notes/${res.data.note.id}`);
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

  // Filter by selected folder when not searching
  const displayedNotes = searchResults !== null
    ? searchResults
    : selectedFolder
    ? notes.filter((n) => n.folder_id === selectedFolder)
    : notes;

  return (
    <div className={styles.layout}>
      <Sidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onFolderSelect={(id) => {
          setSelectedFolder((prev) => (prev === id ? null : id));
          setSearchQuery('');
          setSearchResults(null);
        }}
        onFolderCreated={loadFolders}
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
            <div className={styles.grid}>
              {displayedNotes.map((note) => (
                <NoteCard key={note.id} note={note} onTrash={handleTrash} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;