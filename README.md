# PlumPad 

## Project Overview

PlumPad is a full-stack Notes application built using Node.js and React.js. It allows users to create, edit, and delete notes while ensuring that each user’s data remains private through authentication. 

The application follows a client-server architecture, where the frontend communicates with a backend API, and data is stored in a database.

---

## Features

### User Authentication

* User registration (sign up)
* User login and logout
* Secure access to user-specific data

### Note Management

* Create new notes
* Edit existing notes
* Delete notes
* Each note is linked to the authenticated user
* Support for rich text editing

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

* Stores user and note data
* Uses MySQL for data storage
### Testing

* Backend testing using Mocha/Chai
* Frontend testing using Jest
* Covers core logic such as APIs and data handling

### Code Quality

* SonarQube integration for static code analysis
* Identifies bugs, vulnerabilities, and code smells

---

## Technology Stack

### Frontend

* React.js

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Tools & Libraries

* Pino (logging)
* Mocha & Chai (backend testing)
* Jest (frontend testing)
* SonarQube (code quality)
* Git (version control)

---

## License 

This project is for educational purposes. 