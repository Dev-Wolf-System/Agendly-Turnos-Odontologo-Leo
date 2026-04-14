-- Fase S4: Habilitar Supabase Realtime para chat y notificaciones
-- Ejecutar en Supabase SQL Editor (self-hosted: supabase.avaxhealth.com)

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;

-- Verificar
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
