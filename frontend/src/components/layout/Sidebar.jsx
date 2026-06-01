import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { deleteAccount } from '../../api/user';
import FolderTree from '../folders/FolderTree';
import {
  PlumPadIcon,
  AllNotesIcon,
  TrashIcon,
  LogoutIcon,
  DeleteAccountIcon,
  FavoritesIcon,
  JournalIcon,
  StudyIcon,
  WorkIcon,
  FolderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../ui/Icons';
import styles from './Sidebar.module.css';

// Maps each system folder name to its icon
const SYSTEM_ICONS = {
  Favorites: FavoritesIcon,
  Journal: JournalIcon,
  Study: StudyIcon,
  Work: WorkIcon,
};

const SYSTEM_ICON_CLASSES = {
  Favorites: 'favoritesIcon',
  Journal: 'journalIcon',
  Study: 'studyIcon',
  Work: 'workIcon',
};

const Sidebar = ({ folders, onFolderSelect, selectedFolder, onFolderCreated, isCollapsed, onCollapsedChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allFolders = folders || [];
  const systemFolders = allFolders.filter((f) => f.is_system);
  const userFolders = allFolders.filter((f) => !f.is_system);

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
        <span className={styles.brandIcon}><PlumPadIcon size={27} /></span>
        {!isCollapsed && (
          <div className={styles.brandLockup}>
            <span className={styles.brandText}>PlumPad</span>
            <span className={styles.brandSub}>Your virtual notebook</span>
          </div>
        )}
        <button
          className={styles.collapseBtn}
          onClick={() => onCollapsedChange(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
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

      <div className={styles.scrollArea}>
        {/* Navigation */}
        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              [styles.navItem, isActive && !selectedFolder ? styles.active : ''].join(' ')
            }
            title="All Notes"
          >
            <span className={[styles.iconBox, styles.allNotesIcon].join(' ')}>
              <AllNotesIcon size={18} />
            </span>
            {!isCollapsed && <span className={styles.navLabel}>All Notes</span>}
          </NavLink>

        {/* System folders behave like special, permanent folders */}
        {systemFolders.map((folder) => {
          const Icon = SYSTEM_ICONS[folder.name] || FolderIcon;
          const isActive = selectedFolder === folder.id;
          return (
            <button
              key={folder.id}
              type="button"
              className={[styles.navItem, isActive ? styles.active : ''].join(' ')}
              onClick={() => onFolderSelect(folder.id)}
              title={folder.name}
            >
              <span
                className={[
                  styles.iconBox,
                  styles[SYSTEM_ICON_CLASSES[folder.name]] || '',
                ].join(' ')}
              >
                <Icon size={18} />
              </span>
              {!isCollapsed && <span className={styles.navLabel}>{folder.name}</span>}
            </button>
          );
        })}

        <NavLink
          to="/trash"
          className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
          title="Trash"
        >
          <span className={[styles.iconBox, styles.trashIcon].join(' ')}>
            <TrashIcon size={18} />
          </span>
          {!isCollapsed && <span className={styles.navLabel}>Trash</span>}
        </NavLink>
      </nav>

      {/* Folder tree (user folders only) */}
      {!isCollapsed && (
        <div className={styles.folderSection}>
          <FolderTree
            folders={userFolders}
            selected={selectedFolder}
            onSelect={onFolderSelect}
            onCreated={onFolderCreated}
            onDeleteSelected={() => onFolderSelect(null)}
          />
        </div>
      )}
      </div>

      <div className={styles.footerActions}>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Log Out">
          <span className={styles.footerIcon}><LogoutIcon size={18} /></span>
          {!isCollapsed && <span>Log Out</span>}
        </button>

        <button
          className={styles.deleteAccountBtn}
          onClick={() => setConfirmDelete(true)}
          title="Delete account"
        >
          <span className={styles.footerIcon}><DeleteAccountIcon size={18} /></span>
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