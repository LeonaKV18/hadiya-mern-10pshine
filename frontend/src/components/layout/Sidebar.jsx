import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { deleteAccount } from '../../api/user';
import FolderTree from '../folders/FolderTree';
import styles from './Sidebar.module.css';

const Sidebar = ({ folders, onFolderSelect, selectedFolder, onFolderCreated, isCollapsed, onCollapsedChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted.');
      logout();
      navigate('/login');
    } catch {
      toast.error('Failed to delete account.');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <aside className={[styles.sidebar, isCollapsed ? styles.collapsed : ''].join(' ')}>
      {/* Brand header */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>✦</span>
        {!isCollapsed && <span className={styles.brandText}>PlumPad</span>}
        <button
          className={styles.collapseBtn}
          onClick={() => onCollapsedChange(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User info */}
      {!isCollapsed && (
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className={styles.userMeta}>
            <span className={styles.username}>{user?.username}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
          title="All Notes"
        >
          <span className={styles.navIcon}>◻</span>
          {!isCollapsed && <span>All Notes</span>}
        </NavLink>

        <NavLink
          to="/trash"
          className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
          title="Trash"
        >
          <span className={styles.navIcon}>⊘</span>
          {!isCollapsed && <span>Trash</span>}
        </NavLink>
      </nav>

      {/* Folder tree */}
      {!isCollapsed && (
        <div className={styles.folderSection}>
          <FolderTree
            folders={folders}
            selected={selectedFolder}
            onSelect={onFolderSelect}
            onCreated={onFolderCreated}
            onDeleteSelected={() => onFolderSelect(null)}
          />
        </div>
      )}

      <div className={styles.footerActions}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span className={styles.navIcon}>→</span>
          {!isCollapsed && <span>Log Out</span>}
        </button>

        <button
          className={styles.deleteAccountBtn}
          onClick={() => setConfirmDelete(true)}
          title="Delete account"
        >
          <span className={styles.navIcon}>⚠</span>
          {!isCollapsed && <span>Delete Account</span>}
        </button>
      </div>

      {confirmDelete && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>Delete your account?</h3>
            <p className={styles.dialogBody}>
              This permanently deletes your account and all of your notes and folders. This cannot be undone.
            </p>
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogCancel}
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.dialogConfirm}
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;