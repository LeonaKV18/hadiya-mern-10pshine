import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FolderTree from '../folders/FolderTree';
import styles from './Sidebar.module.css';

const Sidebar = ({ folders, onFolderSelect, selectedFolder, onFolderCreated }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={[styles.sidebar, isCollapsed ? styles.collapsed : ''].join(' ')}>
      {/* Brand header */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>✦</span>
        {!isCollapsed && <span className={styles.brandText}>PlumPad</span>}
        <button
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed((v) => !v)}
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
          className={({ isActive }) =>
            [styles.navItem, isActive ? styles.active : ''].join(' ')
          }
          title="All Notes"
        >
          <span className={styles.navIcon}>◻</span>
          {!isCollapsed && <span>All Notes</span>}
        </NavLink>

        <NavLink
          to="/trash"
          className={({ isActive }) =>
            [styles.navItem, isActive ? styles.active : ''].join(' ')
          }
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
          />
        </div>
      )}

      {/* Logout */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <span className={styles.navIcon}>→</span>
        {!isCollapsed && <span>Log Out</span>}
      </button>
    </aside>
  );
};

export default Sidebar;