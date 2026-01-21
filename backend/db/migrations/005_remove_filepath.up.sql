-- Remove unused filepath column from Curves table
-- SQLite 3.35.0+ supports DROP COLUMN directly

ALTER TABLE Curves DROP COLUMN filepath;
