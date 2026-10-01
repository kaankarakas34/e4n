// A structural catalog for adopting a known, unversioned init.sql database.
// It deliberately excludes rows, ownership, grants and extension objects.
export async function readPublicSchemaCatalog(client) {
  const { rows } = await client.query(`
    SELECT 'column' AS kind, c.table_name AS relation_name, c.column_name AS object_name,
           concat_ws('|', c.data_type, c.udt_name, c.is_nullable,
             COALESCE(c.column_default, ''), COALESCE(c.character_maximum_length::text, ''),
             COALESCE(c.numeric_precision::text, ''), COALESCE(c.numeric_scale::text, '')) AS definition
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name <> 'schema_migrations'
    UNION ALL
    SELECT 'constraint', cls.relname, con.conname, pg_get_constraintdef(con.oid, true)
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE ns.nspname = 'public' AND cls.relname <> 'schema_migrations'
    UNION ALL
    SELECT 'index', tablename, indexname, indexdef
    FROM pg_indexes WHERE schemaname = 'public' AND tablename <> 'schema_migrations'
    UNION ALL
    SELECT 'trigger', cls.relname, trig.tgname, pg_get_triggerdef(trig.oid, true)
    FROM pg_trigger trig
    JOIN pg_class cls ON cls.oid = trig.tgrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE ns.nspname = 'public' AND cls.relname <> 'schema_migrations' AND NOT trig.tgisinternal
    UNION ALL
    SELECT 'function', '', proc.proname, pg_get_functiondef(proc.oid)
    FROM pg_proc proc JOIN pg_namespace ns ON ns.oid = proc.pronamespace
    WHERE ns.nspname = 'public' AND proc.proname = 'fn_check_group_profession_unique'
    ORDER BY kind, relation_name, object_name
  `);
  return rows.map(row => ({ ...row, definition: row.definition.replace(/\r\n/g, '\n').trim() }));
}
