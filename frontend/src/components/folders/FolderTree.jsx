import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createFolder, renameFolder, deleteFolder } from '../../api/folders';
import styles from './FolderTree.module.css';

const FolderItem = ({ folder, depth, selected, onSelect, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showActions, setShowActions] = useState(false);

  const handleRename = async () => {
    if (!editName.trim() || editName.trim() === folder.name) {
      setIsEditing(false);
      return;
    }
    try {
      await renameFolder(folder.id, editName.trim());
      onRefresh();
      setIsEditing(false);
    } catch {
      toast.error('Failed to rename folder.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFolder(folder.id);
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
              if (e.key === 'Escape') setIsEditing(false);
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
              onClick={handleDelete}
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
        />
      ))}
    </div>
  );
};

const FolderTree = ({ folders, selected, onSelect, onCreated }) => {
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createFolder(newName.trim(), null);
      onCreated();
      setNewName('');
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
          onClick={() => setShowInput((v) => !v)}
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
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setShowInput(false);
            }}
            className={styles.createInput}
            autoFocus
          />
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
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTree;