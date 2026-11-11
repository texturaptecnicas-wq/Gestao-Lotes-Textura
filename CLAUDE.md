# Gestão de Lotes (empresa de pintura eletrostática)

App interno: lotes de peças (recebido → programado → pintado → entregue), programação das cabines, Pix, financeiro e qualidade. ~10 aparelhos (PCs e celulares).

## Comandos
- Rodar local: `npm run dev` (porta 3000) · Build: `npm run build` (saída em `dist/apps/web`) · Lint: `npm run lint`
- O código do app fica em `apps/web/src`. Banco/edge functions em `supabase/`.

## Regra nº 1: nunca quebrar o que está em uso
- Toda mudança em ramo separado, nunca direto na `main`. Testar na versão de teste (preview) da Vercel antes de juntar.
- Antes de mudar algo, ler o que depende daquilo (ex.: rotinas que limpam o navegador).
- Nenhuma mudança no banco de produção (Supabase) sem aprovação explícita do Lucas. Mudança de regra/estrutura do banco: salvar antes o script de volta.
- Conferir depois de mudar (recarregar, consultar de novo); não confiar só em "salvo".

## Acesso e segurança (não desfazer)
- Sem tela de login: cada aparelho é ativado uma vez (`src/components/AtivacaoGate.jsx`) com a conta interna `aparelhos@textura.invalid`; a sessão fica salva.
- Banco: todas as tabelas só aceitam usuário autenticado (RLS). Fotos: leitura pública por link; enviar/trocar/apagar só autenticado.
- Nunca usar `localStorage.clear()` nem apagar chaves `sb-*` ou `nomeAparelho` (desativa o aparelho). Lista de chaves preservadas: `src/utils/cleanupStorage.js`.
- Dados da empresa ficam em `src/config/acesso.js`, separados da lógica.
- Os perfis (Usuário, Administrador, Comercial, Financeiro) são só telas; as senhas deles estão no código e NÃO protegem dados. Não criar nova "segurança" desse tipo.

## Convenções
- Textos da interface e mensagens de commit em português.
- Repositório em pasta do OneDrive com quebra de linha Windows: manter `core.autocrlf=true`.
