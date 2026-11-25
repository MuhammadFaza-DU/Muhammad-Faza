CREATE TABLE deletion_tombstones (
  request_id TEXT PRIMARY KEY CHECK(length(request_id)=36),
  project_slug TEXT NOT NULL CHECK(length(project_slug) BETWEEN 1 AND 80),
  comment_id TEXT NOT NULL UNIQUE CHECK(length(comment_id)=36),
  expires_at INTEGER NOT NULL CHECK(expires_at>0)
) STRICT;
CREATE INDEX deletion_tombstones_expiry ON deletion_tombstones(expires_at);

INSERT INTO deletion_tombstones(request_id,project_slug,comment_id,expires_at)
SELECT request_id,project_slug,comment_id,unixepoch()*1000+86400000
FROM submission_receipts WHERE deleted=1;

DROP TRIGGER comment_deleted_receipt;
CREATE TRIGGER comment_deleted_receipt AFTER DELETE ON comments
BEGIN
  INSERT INTO deletion_tombstones(request_id,project_slug,comment_id,expires_at)
  VALUES(OLD.request_id,OLD.project_slug,OLD.id,unixepoch()*1000+86400000)
  ON CONFLICT(request_id) DO UPDATE SET
    comment_id=excluded.comment_id,
    project_slug=excluded.project_slug,
    expires_at=excluded.expires_at;
  UPDATE submission_receipts SET deleted=1,
    expires_at=max(expires_at,unixepoch()*1000+86400000)
  WHERE request_id=OLD.request_id;
END;
