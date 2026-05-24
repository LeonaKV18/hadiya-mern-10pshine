-- Reference documentation for the folder_id column on notes.
-- This column is managed by the Sequelize Note model definition.

ALTER TABLE notes ADD COLUMN folder_id INT DEFAULT NULL;
ALTER TABLE notes ADD FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;