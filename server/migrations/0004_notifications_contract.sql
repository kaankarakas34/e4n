-- Align new/source installations with the observed live title/message/read contract.
-- Old content/is_read columns remain during the transition; API responses use only canonical fields.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'content'
  ) THEN
    EXECUTE $sql$
      UPDATE notifications
      SET message = COALESCE(message, content), title = COALESCE(title, 'Bildirim')
      WHERE message IS NULL AND content IS NOT NULL
    $sql$;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    EXECUTE $sql$
      UPDATE notifications
      SET read = COALESCE(read, FALSE) OR COALESCE(is_read, FALSE)
    $sql$;
  END IF;
  IF EXISTS (SELECT 1 FROM notifications WHERE title IS NULL OR message IS NULL) THEN
    RAISE EXCEPTION 'Notifications contain rows without recoverable title/message';
  END IF;
END;
$$;

UPDATE notifications SET type = 'SYSTEM' WHERE type IS NULL;
ALTER TABLE notifications ALTER COLUMN title SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN message SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN read SET DEFAULT FALSE;
