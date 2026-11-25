CREATE TABLE rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY CHECK(length(bucket_key)=64),
  hits INTEGER NOT NULL CHECK(hits BETWEEN 0 AND 6),
  expires_at INTEGER NOT NULL CHECK(expires_at>0)
) STRICT;
CREATE INDEX rate_buckets_expiry ON rate_limit_buckets(expires_at);

CREATE TABLE submission_receipts (
  request_id TEXT PRIMARY KEY CHECK(length(request_id)=36),
  payload_hash TEXT NOT NULL CHECK(length(payload_hash)=64),
  token_digest TEXT NOT NULL UNIQUE CHECK(length(token_digest)=64),
  comment_id TEXT NOT NULL UNIQUE CHECK(length(comment_id)=36),
  project_slug TEXT NOT NULL CHECK(length(project_slug) BETWEEN 1 AND 80),
  created_at INTEGER NOT NULL CHECK(created_at>0),
  expires_at INTEGER NOT NULL CHECK(expires_at>created_at),
  deleted INTEGER NOT NULL DEFAULT 0 CHECK(deleted IN (0,1)),
  abuse_key TEXT NOT NULL CHECK(length(abuse_key)=64)
) STRICT;
CREATE INDEX receipts_expiry ON submission_receipts(expires_at);

CREATE TABLE comments (
  id TEXT PRIMARY KEY CHECK(length(id)=36),
  project_slug TEXT NOT NULL CHECK(length(project_slug) BETWEEN 1 AND 80),
  display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 60),
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 1600),
  created_at INTEGER NOT NULL CHECK(created_at>0),
  request_id TEXT NOT NULL UNIQUE CHECK(length(request_id)=36)
) STRICT;
CREATE INDEX comments_project_order ON comments(project_slug,created_at DESC,id DESC);

CREATE TRIGGER comment_rate_accept AFTER INSERT ON comments
BEGIN
  UPDATE rate_limit_buckets SET hits=hits+1
  WHERE bucket_key=(SELECT abuse_key FROM submission_receipts WHERE request_id=NEW.request_id);
END;

CREATE TRIGGER comment_deleted_receipt AFTER DELETE ON comments
BEGIN
  UPDATE submission_receipts SET deleted=1 WHERE request_id=OLD.request_id;
END;
