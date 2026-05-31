-- Reference documentation for the deleted_at column added to notes.
-- This column is managed by Sequelize paranoid mode on the Note model.

ALTER TABLE notes ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;