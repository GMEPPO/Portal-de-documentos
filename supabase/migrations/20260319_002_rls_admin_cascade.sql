-- Idempotente: elimina la funcion y sus dependencias para poder recrear policies sin fallar.
drop function if exists public.is_admin(uuid) cascade;

-- NOTE: El resto del script RLS/policies lo aplicarás a continuación (según tu plan).
