-- Restore filepath column to Curves table

ALTER TABLE Curves ADD COLUMN filepath TEXT NOT NULL DEFAULT '';
