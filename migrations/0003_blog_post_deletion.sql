-- The audit log keeps the article UUID after its content is permanently deleted.
ALTER TABLE blog_post_audit
  DROP CONSTRAINT blog_post_audit_post_id_fkey,
  DROP CONSTRAINT blog_post_audit_action_check,
  ADD CONSTRAINT blog_post_audit_action_check
    CHECK (action IN ('created', 'updated', 'status_changed', 'deleted'));
