# Relatório de Recuperação e Isolamento Financeiro (FINANCE_RECOVERY)

## Visão Geral
Este documento detalha o processo de recuperação e isolamento arquitetural dos dados financeiros do sistema, separando-os completamente do módulo de qualidade.

## Arquitetura de Dados (Novas Tabelas)
Duas novas tabelas foram criadas no Supabase para garantir isolamento e integridade:

### 1. `financial_records`
Tabela principal para todos os lançamentos financeiros.
- `id` (UUID, PK)
- `descricao` (TEXT)
- `tipo` (TEXT: 'entrada', 'saida')
- `valor` (NUMERIC)
- `data_lancamento` (DATE)
- `categoria` (TEXT)
- `status` (TEXT: 'pendente', 'confirmado', 'cancelado')
- `observacoes` (TEXT)
- Timestamps (`created_at`, `updated_at`)

### 2. `financial_audit_log`
Tabela de auditoria para rastrear todas as alterações.
- `id` (UUID, PK)
- `financial_record_id` (UUID, FK)
- `acao` (TEXT: 'criado', 'atualizado', 'deletado')
- `dados_anteriores` (JSONB)
- `dados_novos` (JSONB)
- `usuario` (TEXT)

## Migração de Dados
Os dados legados das tabelas `pix_lancados`, `pix_pendentes` e `pix_records` foram consolidados e normalizados para a tabela `financial_records`. 

## Componentes Criados
- **Validação:** `src/utils/financeValidation.js`
- **Serviços:** `src/services/financeService.js` (totalmente isolado do `qualityService.js`)
- **Interface:** `FinanceModule`, `FinanceSummary`, `FinanceReportTable`, `FinanceCharts`, `FinanceFilters`, `FinanceModal`.

## Como Utilizar
1. O módulo financeiro é acessado via botão no cabeçalho (apenas para Administradores).
2. Nenhuma operação financeira afeta lotes ou qualidade.
3. Se um erro ocorrer, a tabela `financial_audit_log` contém o histórico para rollback manual.