-- DESFAZ supabase/migrations/20261125_registro_programacao.sql
--
-- ATENÇÃO: antes de rodar, volte a main para a versão SEM o registro de
-- programação (o código do ramo `registro-programacao` grava `programado_por`;
-- se as colunas sumirem com esse código no ar, programar lotes passa a falhar).
-- Apaga os registros de quem programou; o resto dos dados não é tocado.
--
-- Rodar no SQL Editor do Supabase (projeto uczrouqdhglvgwmzfiwf).

begin;

drop trigger if exists trg_registrar_programacao_lote on public.lotes;
drop function if exists public.registrar_programacao_lote();

alter table public.lotes
  drop column if exists programado_por,
  drop column if exists programado_em;

alter table public.historico
  drop column if exists programado_por,
  drop column if exists programado_em;

commit;
