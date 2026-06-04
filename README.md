# PlumPad 

## Project Overview

PlumPad is a full-stack Notes application built using Node.js, React.js and MySQL. It allows users to create, organize, edit, search, pin, summarize, export and delete notes while ensuring that each user’s data remains private through authentication. 

The application follows a client-server architecture, where the frontend communicates with a backend API, and data is stored in a database.

---

## Features

### User Authentication

* User registration and login
* Email verification flow
* Logout and session restore
* JWT-based authentication
* Protected access to user-specific notes and folders
* Account deletion support

### Note Management

* Create new notes
* Edit existing notes
* Autosave note updates
* Delete notes by moving them to trash
* Restore notes from trash
* Permanently delete trashed notes
* Pin and unpin important notes
* Search notes by title or content
* Move notes between folders
* Export notes in supported formats
* Generate AI summaries for note content

### Rich Text Editing

* Rich text note editor
* Support for formatted note content
* Stores note content as rich HTML
* Supports realistic note-taking use cases such as lists, headings, emphasis, annotations, and structured content

### Folder Management

* Create custom folders
* Rename folders
* Delete folders
* Assign colors to folders
* Move notes into folders
* Includes protected system folders:
  * Favourites
  * Journal
  * Study
  * Work
* System folders are created automatically and cannot be renamed or deleted





### Frontend Experience

* React Router-based navigation
* Authentication context for user session handling
* Axios API client with JWT token injection
* Toast notifications for user feedback
* Reusable UI components
* Dashboard, note editor, trash, login, register, verify email, and auth callback pages
* Global PlumPad styling and design tokens



### Logging



### Logging

* Application logging using Pino
* Logs include:
  * HTTP requests and responses
  * Errors and exceptions
  * User actions

### Exception Handling

* Centralised error handling in the backend
* Meaningful error responses for users
* Errors are logged for debugging

### Database Integration

* Uses MySQL for data storage
* Uses Sequelize for database models and queries
* Stores users, notes, folders, attachments, and related records
* Supports soft deletion for notes using trash behavior

### Testing
* Backend testing using Mocha/Chai
* Frontend testing using Jest and React Testing Library
* Covers core backend services and frontend user flows
* Includes tests for notes, folders, authentication pages, dashboard behavior, editor actions, and trash actions

### Code Quality

* SonarQube integration for static code analysis
* Identifies bugs, vulnerabilities, and code smells

---

## Technology Stack

### Frontend

* React.js
* CSS Modules

### Backend

* Node.js
* Express.js
* Sequelize
* JWT authentication
* Passport authentication support
* Pino logging

### Database

* MySQL

### Testing

* Pino (logging)
* Mocha & Chai (backend testing)
* Jest (frontend testing)
* SonarQube (code quality)

---

## License 

This project is for educational purposes. 