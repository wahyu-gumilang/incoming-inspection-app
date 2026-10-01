-- Item master had no key. Fails with a duplicate-entry error (and changes
-- nothing) if two rows share an itemid; check-data.js lists them.
ALTER TABLE inventtable ADD PRIMARY KEY (itemid);
