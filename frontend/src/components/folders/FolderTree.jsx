import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createFolder, renameFolder, deleteFolder } from '../../api/folders';
import styles from './FolderTree.module.css';

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className={styles.dialogOverlay}>
    <div className={styles.dialog}>
      <p className={styles.dialogMsg}>{message}</p>
      <div className={styles.dialogActions}>
        <button className={styles.dialogCancel} onClick={onCancel}>Cancel</button>
        <button className={styles.dialogConfirm} onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

const FolderItem = ({ folder, depth, selected, onSelect, onRefresh, onDeleteSelected, allFolders }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRename = async () => {
      const trimmed = editName.trim();
      if (!trimmed || trimmed === folder.name) {
        setIsEditing(false);
        return;
      }

      // Check for duplicate name (case-insensitive, excluding self)
      const isDuplicate = allFolders.some(
        (f) => f.id !== folder.id && f.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) {
        toast.error('A folder with this name already exists.');
        setEditName(folder.name);
        setIsEditing(false);
        return;
      }

      try {
        await renameFolder(folder.id, trimmed);
        onRefresh();
        setIsEditing(false);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to rename folder.';
        toast.error(msg);
        setIsEditing(false);
      }
    };

  const handleDeleteConfirmed = async () => {
    setConfirmDelete(false);
    try {
      await deleteFolder(folder.id);
      // If the deleted folder was currently selected, clear the selection
      if (selected === folder.id) {
        onDeleteSelected();
      }
      onRefresh();
    } catch {
      toast.error('Failed to delete folder.');
    }
  };

  return (
    <div>
      <div
        className={[
          styles.folderItem,
          selected === folder.id ? styles.selected : '',
        ].join(' ')}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={() => onSelect(folder.id)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <span className={styles.folderIcon}>▸</span>

        {isEditing ? (
          <input
            className={styles.editInput}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setIsEditing(false); setEditName(folder.name); }
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={styles.folderName}>{folder.name}</span>
        )}

        {showActions && !isEditing && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.actionBtn}
              onClick={() => setIsEditing(true)}
              title="Rename"
            >
              ✎
            </button>
            <button
              className={[styles.actionBtn, styles.deleteBtn].join(' ')}
              onClick={() => setConfirmDelete(true)}
              title="Delete"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Render child folders recursively */}
      {folder.children?.map((child) => (
        <FolderItem
          key={child.id}
          folder={child}
          depth={depth + 1}
          selected={selected}
          onSelect={onSelect}
          onRefresh={onRefresh}
          onDeleteSelected={onDeleteSelected}
        />
      ))}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${folder.name}" and move all its notes to All Notes?`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

const FolderTree = ({ folders, selected, onSelect, onCreated, onDeleteSelected }) => {
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // Check for duplicate name
    if (folders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('A folder with this name already exists.');
      return;
    }

    try {
      await createFolder(trimmed, null);
      onCreated();
      setNewName('');
      setNameError('');
      setShowInput(false);
    } catch {
      toast.error('Failed to create folder.');
    }
  };

  return (
    <div className={styles.tree}>
      <div className={styles.treeHeader}>
        <span className={styles.treeLabel}>Folders</span>
        <button
          className={styles.addBtn}
          onClick={() => { setShowInput((v) => !v); setNameError(''); }}
          title="New folder"
        >
          +
        </button>
      </div>

      {showInput && (
        <div className={styles.newFolderInput}>
          <input
            placeholder="Folder name..."
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowInput(false); setNameError(''); }
            }}
            className={styles.createInput}
            autoFocus
          />
          {nameError && <p className={styles.nameError}>{nameError}</p>}
        </div>
      )}

      <div className={styles.folderList}>
        {folders.length === 0 && (
          <p className={styles.empty}>No folders yet</p>
        )}
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            depth={0}
            selected={selected}
            onSelect={onSelect}
            onRefresh={onCreated}
            onDeleteSelected={onDeleteSelected}
            allFolders={folders}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTree;