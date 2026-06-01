import React from 'react';
import featherUrl from '../../assets/feather.svg';

// Shared SVG attributes for all icons. Color comes from `currentColor`, so icon takes CSS `color` of its container and can be brightened on hover.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

const make = (children) => ({ size = 20, className, ...rest }) => (
  <svg {...base} width={size} height={size} className={className} {...rest}>
    {children}
  </svg>
);

export const PlumPadIcon = ({ size = 20, className, ...rest }) => (
  <img
    src={featherUrl}
    width={size}
    height={size}
    className={className}
    alt=""
    aria-hidden="true"
    {...rest}
  />
);

export const AllNotesIcon = make(
  <>
    <path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </>
);

export const FavoritesIcon = make(
  <path d="M12 3.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.88l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z" />
);

export const JournalIcon = make(
  <>
    <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
    <path d="M18 16H7a2 2 0 0 0-2 2" />
  </>
);

export const StudyIcon = make(
  <>
    <path d="M12 4L2 9l10 5 10-5z" />
    <path d="M6 11v5c0 1 3 2 6 2s6-1 6-2v-5" />
  </>
);

export const WorkIcon = make(
  <>
    <path d="M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M3 12h18" />
  </>
);

export const TrashIcon = make(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </>
);

export const FolderIcon = make(
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
);

export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </>
);

export const NewNoteIcon = make(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>
);

export const LogoutIcon = make(
  <>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 12h10" />
    <path d="M17 9l3 3-3 3" />
  </>
);

export const DeleteAccountIcon = make(
  <>
    <circle cx="9" cy="8" r="4" />
    <path d="M3 21v-1a6 6 0 0 1 6-6h1" />
    <path d="M16 16l5 5M21 16l-5 5" />
  </>
);

export const PinIcon = make(
  <>
    <path d="M9 4h6l-1 6 3 3v2h-5v5l-1 1-1-1v-5H4v-2l3-3z" />
  </>
);

export const MoveIcon = make(
  <>
    <path d="M7 7h10v10" />
    <path d="M17 7L7 17" />
  </>
);

export const EditIcon = make(
  <path d="M4 20h4L18 10a2 2 0 0 0-3-3L5 17z" />
);

export const CloseIcon = make(
  <path d="M6 6l12 12M18 6L6 18" />
);

export const RobotIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v3" />
    <path d="M8 5h8" />
    <rect x="5" y="7" width="14" height="11" rx="3" />
    <path d="M9 12h.01" />
    <path d="M15 12h.01" />
    <path d="M9.5 15h5" />
    <path d="M3 11v4" />
    <path d="M21 11v4" />
  </svg>
);

export const ChevronLeftIcon = make(<path d="M14 7l-5 5 5 5" />);
export const ChevronRightIcon = make(<path d="M10 7l5 5-5 5" />);