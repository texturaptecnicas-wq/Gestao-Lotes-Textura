import { ACESSO } from '@/config/acesso';

const PERFIS = {
  administrador: 'Admin',
  comercial: 'Comercial',
  financeiro: 'Financeiro',
  usuario: 'Usuário',
};

// Identifica quem fez uma ação: nome dado ao aparelho na ativação + perfil
// escolhido na tela inicial. Ex.: "PC comercial · Admin".
// Só lê o navegador; nunca grava nem apaga chaves (ver cleanupStorage.js).
export const identificacaoAparelho = () => {
  let nome = '';
  let perfil = '';
  try {
    nome = (localStorage.getItem(ACESSO.chaveNomeAparelho) || '').trim();
    perfil = localStorage.getItem('userRole') || '';
  } catch {
    // Navegador sem acesso ao armazenamento: segue sem identificação.
  }
  const partes = [nome || 'Aparelho sem nome', PERFIS[perfil] || perfil].filter(Boolean);
  return partes.join(' · ').slice(0, 120);
};
