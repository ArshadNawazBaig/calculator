-- Additive editorial storage. The auth migration creates blog_user first.
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title VARCHAR(160) NOT NULL DEFAULT '',
  excerpt VARCHAR(320) NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '' CHECK (length(content) <= 100000),
  category TEXT NOT NULL DEFAULT 'Updates' CHECK (category IN ('Finance', 'Health', 'Math', 'Everyday', 'Updates')),
  cover_image_url TEXT,
  cover_image_alt VARCHAR(300) NOT NULL DEFAULT '',
  seo_title VARCHAR(70) NOT NULL DEFAULT '',
  seo_description VARCHAR(200) NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id TEXT NOT NULL REFERENCES blog_user(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  CHECK (cover_image_url IS NULL OR length(trim(cover_image_alt)) > 0),
  CHECK (status <> 'published' OR (published_at IS NOT NULL AND length(trim(title)) > 0 AND length(trim(excerpt)) > 0 AND length(trim(content)) > 0))
);
CREATE INDEX IF NOT EXISTS blog_posts_public_order ON blog_posts (published_at DESC, id DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS blog_posts_public_category ON blog_posts (category, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS blog_posts_admin_order ON blog_posts (updated_at DESC, id DESC);

-- Lock an established public URL even if its post is later unpublished.
CREATE OR REPLACE FUNCTION blog_preserve_published_identity() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    IF NEW.slug <> OLD.slug THEN
      RAISE EXCEPTION 'A previously published slug is immutable' USING ERRCODE = '23514', CONSTRAINT = 'blog_published_slug_immutable';
    END IF;
    NEW.published_at := OLD.published_at;
  ELSIF NEW.status = 'published' THEN
    NEW.published_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER blog_preserve_published_identity_trigger BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION blog_preserve_published_identity();

CREATE TABLE IF NOT EXISTS blog_post_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES blog_posts(id),
  actor_id TEXT NOT NULL REFERENCES blog_user(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed')),
  from_status TEXT,
  to_status TEXT NOT NULL,
  post_version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS blog_post_audit_post ON blog_post_audit (post_id, created_at DESC);
