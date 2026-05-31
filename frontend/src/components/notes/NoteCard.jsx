import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NoteCard.module.css';

// Strips HTML for the preview snippet
const stripHtml = (html) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const NoteCard = ({ note, onTrash }) => {
  const navigate = useNavigate();

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

  return (
    <div className={styles.card} onClick={() => navigate(`/notes/${note.id}`)}>
      <div className={styles.cardInner}>
        <h3 className={styles.title}>{note.title || 'Untitled'}</h3>
        <p className={styles.preview}>{preview || 'No content yet...'}</p>
      </div>
      <div className={styles.footer}>
        <span className={styles.date}>{date}</span>
        <button
          className={styles.trashBtn}
          onClick={handleTrash}
          title="Move to trash"
        >
          ⊘
        </button>
      </div>
    </div>
  );
};

export default NoteCard;