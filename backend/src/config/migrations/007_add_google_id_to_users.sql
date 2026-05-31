-- Reference documentation for the google_id column on users.
-- Managed by the Sequelize User model definition.

ALTER TABLE users 
  ADD COLUMN google_id VARCHAR(255) DEFAULT NULL UNIQUE,
  MODIFY COLUMN password_hash VARCHAR(255) DEFAULT NULL;
-- password_hash becomes nullable because Google users do not have a password.