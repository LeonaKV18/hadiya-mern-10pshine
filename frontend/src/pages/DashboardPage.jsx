import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getNotes, createNote, trashNote, searchNotes, updateNote, togglePin } from '../api/notes';
import { getFolders } from '../api/folders';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import NoteCard from '../components/notes/NoteCard';
import Button from '../components/ui/Button';
import { SearchIcon, NewNoteIcon } from '../components/ui/Icons';
import styles from './DashboardPage.module.css';

// Returns a time-of-day greeting word for the given hour
const getGreeting = (hour) => {
  if (hour < 5) return 'Late night thoughts';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Chooses which notes to display based on the active search/folder filters
const pickDisplayedNotes = (searchResults, selectedFolder, notes) => {
  if (searchResults !== null) return searchResults;
  if (selectedFolder) return notes.filter((n) => n.folder_id === selectedFolder);
  return notes;
};

// Builds the heading shown above the notes grid
const getSectionTitle = (searchResults, searchQuery, selectedFolder, folders) => {
  if (searchResults !== null) return `Results for "${searchQuery}"`;
  if (selectedFolder) return folders.find((f) => f.id === selectedFolder)?.name || 'Folder';
  return 'All Notes';
};

// Presentational body so the loading/empty/list branching stays out of the page component
const NotesArea = ({ isLoading, displayedNotes, searchResults, pinnedNotes, otherNotes, renderCard }) => {
  if (isLoading) {
    return (
      <div className={styles.loadingGrid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }
  if (displayedNotes.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📑</div>
        <p className={styles.emptyTitle}>
          {searchResults !== null ? 'No notes match your search.' : 'No notes yet.'}
        </p>
        {searchResults === null && (
          <p className={styles.emptyHint}>Click "New Note" to get started.</p>
        )}
      </div>
    );
  }
  return (
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
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFolder = searchParams.get('folder')
    ? Number.parseInt(searchParams.get('folder'), 10)
    : null;

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

  const displayedNotes = pickDisplayedNotes(searchResults, selectedFolder, notes);
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

  const hour = new Date().getHours();
  const greetingWord = getGreeting(hour);

  // Renders a single card wrapped with its selection checkbox
  const renderCard = (note, index) => (
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
        variant={index % 4}
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
            <SearchIcon className={styles.searchIcon} size={16} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <Button onClick={handleCreateNote} isLoading={isCreating}>
            <NewNoteIcon size={16} /> New Note
          </Button>
        </header>

        {/* Notes area */}
        <div className={styles.content}>
          <div className={styles.greeting}>
            <h1 className={styles.greetingTitle}>
              {hour < 5
                ? `${greetingWord}, ${user?.username || 'there'}?`
                : `${greetingWord}, ${user?.username || 'there'}`}
            </h1>
            <p className={styles.greetingSub}>Here's your cozy little workspace.</p>
          </div>

          {selectedNoteIds.size > 0 && (
            <div className={styles.bulkBar}>
              <button className={styles.selectAllBtn} onClick={toggleSelectAll}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              <span className={styles.bulkCount}>{`${selectedNoteIds.size} selected`}</span>
              <button className={styles.bulkBtn} onClick={handleBulkTrash}>Move to Trash</button>
              {folders.length > 0 && (
                <select
                  className={styles.bulkSelect}
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    handleBulkMove(val === '' ? null : Number.parseInt(val, 10));
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>Move to folder...</option>
                  <option value="">All Notes (no folder)</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
              <button className={styles.bulkBtn} onClick={() => setSelectedNoteIds(new Set())}>Clear</button>
            </div>
          )}

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {getSectionTitle(searchResults, searchQuery, selectedFolder, folders)}
            </h2>
            <span className={styles.noteCount}>{displayedNotes.length} notes</span>
          </div>

          <NotesArea
            isLoading={isLoading}
            displayedNotes={displayedNotes}
            searchResults={searchResults}
            pinnedNotes={pinnedNotes}
            otherNotes={otherNotes}
            renderCard={renderCard}
          />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;