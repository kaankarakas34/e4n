-- Additive CMS workflow. No grants, RLS or storage policy changes.
ALTER TABLE public.blogs
 ADD COLUMN cluster_key text CHECK (cluster_key IS NULL OR cluster_key ~ '^(0[1-9]|1[0-8])$'),
 ADD COLUMN pillar_slug text,
 ADD COLUMN related_slugs text[] NOT NULL DEFAULT '{}',
 ADD COLUMN editorial_brief text NOT NULL DEFAULT '',
 ADD COLUMN image_rights_source text NOT NULL DEFAULT '',
 ADD COLUMN reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
 ADD COLUMN reviewed_at timestamptz;
ALTER TABLE public.blogs ADD CONSTRAINT blogs_related_limit CHECK (cardinality(related_slugs)<=6);
