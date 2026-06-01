import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { createFolder, renameFolder, deleteFolder, updateFolder } from '../../api/folders';
import { EditIcon, CloseIcon } from '../ui/Icons';
import styles from './FolderTree.module.css';

// Limited pastel palette that matches the app's vibe
const PALETTE = ['#d54ea4', '#9364d4', '#73d0a0', '#67d9d5', '#e17676', '#bb5aa8', '#ffeab2'];

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
  const [showColors, setShowColors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const colorBtnRef = useRef(null);
  const colorPopoverRef = useRef(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

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
      if (selected === folder.id) onDeleteSelected();
      onRefresh();
    } catch {
      toast.error('Failed to delete folder.');
    }
  };

  const handleColor = async (color) => {
    setShowColors(false);
    try {
      await updateFolder(folder.id, { color });
      onRefresh();
    } catch {
      toast.error('Failed to update folder color.');
    }
  };

  const toggleColorPopover = (e) => {
    e.stopPropagation();

    const rect = colorBtnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const popoverWidth = 150;
    const popoverHeight = 90;
    const gap = 8;

    let left = rect.right - popoverWidth;
    let top = rect.bottom + gap;

    if (top + popoverHeight > window.innerHeight - 8) {
      top = rect.top - popoverHeight - gap;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

    setPopoverPos({ top, left });
    setShowColors((v) => !v);
    setShowActions(true);
  };

  useEffect(() => {
    if (!showColors) return;

    const handleClickOutside = (e) => {
      const clickedButton = colorBtnRef.current?.contains(e.target);
      const clickedPopover = colorPopoverRef.current?.contains(e.target);

      if (!clickedButton && !clickedPopover) {
        setShowColors(false);
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColors]);

  return (
    <div>
      <div
        className={[styles.folderItem, selected === folder.id ? styles.selected : ''].join(' ')}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={() => onSelect(folder.id)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          if (!showColors) setShowActions(false);
        }}
      >
        <span className={styles.colorTag} style={{ background: folder.color || 'var(--color-plum-pale)' }} />

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

        {(showActions || showColors) && !isEditing && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <button
              ref={colorBtnRef}
              className={styles.actionBtn}
              onClick={toggleColorPopover}
              title="Color"
            >
              <span
                className={styles.colorSwatchCurrent}
                style={{ background: folder.color || 'var(--color-plum-pale)' }}
              />
            </button>
            <button className={styles.actionBtn} onClick={() => setIsEditing(true)} title="Rename">
              <EditIcon size={14} />
            </button>
            <button className={[styles.actionBtn, styles.deleteBtn].join(' ')} onClick={() => setConfirmDelete(true)} title="Delete">
              <CloseIcon size={14} />
            </button>
          </div>
        )}

        {showColors &&
          createPortal(
            <div
              ref={colorPopoverRef}
              className={styles.colorPopover}
              style={{
                top: `${popoverPos.top}px`,
                left: `${popoverPos.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {PALETTE.map((c) => (
                <button
                  key={c}
                  className={[styles.swatch, folder.color === c ? styles.swatchActive : ''].join(' ')}
                  style={{ background: c }}
                  onClick={() => handleColor(c)}
                  title={c}
                />
              ))}
              <button
                className={styles.swatchClear}
                onClick={() => handleColor(null)}
                title="No color"
              >
                ×
              </button>
            </div>,
            document.body
          )}
      </div>

      {folder.children?.map((child) => (
        <FolderItem
          key={child.id}
          folder={child}
          depth={depth + 1}
          selected={selected}
          onSelect={onSelect}
          onRefresh={onRefresh}
          onDeleteSelected={onDeleteSelected}
          allFolders={allFolders}
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
        {folders.length === 0 && <p className={styles.empty}>No folders yet</p>}
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