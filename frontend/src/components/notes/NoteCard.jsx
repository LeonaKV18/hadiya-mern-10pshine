import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateNote } from '../../api/notes';
import toast from 'react-hot-toast';
import { PinIcon, MoveIcon, TrashIcon, FolderIcon } from '../ui/Icons';
import styles from './NoteCard.module.css';

// Strips HTML for the preview snippet
const stripHtml = (html) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const NoteCard = ({ note, onTrash, folderName, folders = [], onMoved, onPin, variant = 0 }) => {
  const navigate = useNavigate();
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const preview = stripHtml(note.content);
  const date = new Date(note.updated_at || note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleTrash = (e) => {
    e.stopPropagation();
    onTrash(note.id);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    if (onPin) onPin(note.id);
  };

  const handleMove = async (e, folderId) => {
    e.stopPropagation();
    setShowMoveMenu(false);
    try {
      await updateNote(note.id, note.title, note.content, folderId);
      toast.success(folderId ? 'Note moved.' : 'Note moved to All Notes.');
      if (onMoved) onMoved();
    } catch {
      toast.error('Failed to move note.');
    }
  };

  // Pinned cards keep their dedicated style; others rotate through pastel variants
  const toneClass = note.is_pinned ? styles.pinnedCard : styles[`variant${variant % 4}`];

  return (
    <div
      className={[styles.card, toneClass].join(' ')}
      onClick={() => navigate(`/notes/${note.id}`)}
    >
      <div className={styles.cardInner}>
        {folderName && (
          <span className={styles.folderBadge}>
            <FolderIcon size={12} /> {folderName}
          </span>
        )}
        <h3 className={styles.title}>{note.title || 'Untitled'}</h3>
        <p className={styles.preview}>{preview || 'No content yet...'}</p>
      </div>
      <div className={styles.footer}>
        <span className={styles.date}>{date}</span>
        <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
          <button
            className={[styles.pinBtn, note.is_pinned ? styles.pinActive : ''].join(' ')}
            onClick={handlePin}
            title={note.is_pinned ? 'Unpin note' : 'Pin note'}
          >
            <PinIcon size={15} />
          </button>

          {folders.length > 0 && (
            <div className={styles.moveWrapper}>
              <button
                className={styles.moveBtn}
                onClick={(e) => { e.stopPropagation(); setShowMoveMenu((v) => !v); }}
                title="Move to folder"
              >
                <MoveIcon size={15} />
              </button>
              {showMoveMenu && (
                <div className={styles.moveMenu}>
                  <button className={styles.moveMenuItem} onClick={(e) => handleMove(e, null)}>
                    All Notes (no folder)
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      className={[
                        styles.moveMenuItem,
                        note.folder_id === f.id ? styles.moveMenuItemActive : '',
                      ].join(' ')}
                      onClick={(e) => handleMove(e, f.id)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className={styles.trashBtn} onClick={handleTrash} title="Move to trash">
            <TrashIcon size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;