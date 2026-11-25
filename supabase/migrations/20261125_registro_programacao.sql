-- Registro de quem programou cada lote (aparelho + perfil) e quando.
--
-- APLICAR ANTES de publicar o código do ramo `registro-programacao`.
-- Só ADICIONA colunas que aceitam vazio e um gatilho: a versão atual do app
-- continua funcionando igual com esta mudança aplicada.
-- Para desfazer: supabase/rollback/20261125_registro_programacao_rollback.sql
--
-- Rodar no SQL Editor do Supabase (projeto uczrouqdhglvgwmzfiwf).

begin;

-- 1) Colunas novas no lote.
alter table public.lotes
  add column if not exists programado_por text,
  add column if not exists programado_em timestamptz;

-- 2) As mesmas colunas no histórico: a entrega copia o lote inteiro para
--    `historico`; sem elas, toda entrega passaria a falhar.
alter table public.historico
  add column if not exists programado_por text,
  add column if not exists programado_em timestamptz;

-- 3) Gatilho: sempre que um lote passa a programado, grava a hora do servidor.
--    Se a gravação não disser quem programou (ex.: algo fora do app),
--    fica registrado como 'sem identificação' — isso também serve de pista.
create or replace function public.registrar_programacao_lote()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.programado is true
     and (tg_op = 'INSERT' or old.programado is distinct from true) then
    new.programado_em := now();
    new.programado_por := coalesce(nullif(btrim(new.programado_por), ''), 'sem identificação');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_registrar_programacao_lote on public.lotes;
create trigger trg_registrar_programacao_lote
  before insert or update of programado on public.lotes
  for each row
  execute function public.registrar_programacao_lote();

commit;

-- Conferência (só leitura) depois de aplicar:
-- select column_name, table_name from information_schema.columns
--  where table_schema = 'public' and column_name in ('programado_por', 'programado_em');
-- select trigger_name from information_schema.triggers where event_object_table = 'lotes';
