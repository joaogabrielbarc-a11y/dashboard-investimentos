# Pondera — arquitetura multiusuário e multiportfólio

## Visão geral

O dashboard continua publicado como front-end estático no GitHub Pages. Autenticação, autorização e persistência passam a ser fornecidas pelo Supabase (Auth + PostgreSQL + Row Level Security).

O Histórico de Lançamentos permanece como fonte única dos saldos. Posições, custo médio ponderado, lucro realizado, patrimônio, alocações e proventos recebidos são resultados derivados pelo `PonderaFinance`.

## Camadas

- `core/finance-service.js`: funções puras de cálculo financeiro, sem acesso ao DOM ou banco.
- `core/supabase-repository.js`: autenticação e persistência; não contém regra financeira.
- `core/portfolio-store.js`: estado global, contexto selecionado e orquestração.
- `v40-platform.js`: interface de login, seletor global e ponte temporária com os componentes legados.
- `supabase/migrations/202609110001_multi_portfolio.sql`: schema, funções atômicas, chaves compostas e políticas RLS.

## Isolamento e RBAC

Todas as tabelas financeiras carregam `user_id` e `portfolio_id`. Chaves estrangeiras compostas impedem que registros de um usuário sejam associados à carteira de outro. As políticas RLS exigem `auth.uid() = user_id` em leitura e escrita.

O papel `admin` não ignora RLS no navegador. Operações administrativas globais só podem usar a `service_role` em ambiente servidor, nunca no JavaScript publicado.

Supabase Auth mantém a entidade de autenticação e suas identidades. A tabela `profiles` usa o mesmo UUID, permitindo adicionar Google OAuth posteriormente sem duplicar usuários.

## Consolidação

- Contexto `portfolio`: carrega uma única carteira e permite alterações.
- Contexto `consolidated`: carrega somente carteiras com `include_in_consolidated = true`, agrega patrimônio, lançamentos e renda e permanece somente leitura.
- Carteiras com a flag desativada continuam acessíveis individualmente, mas não entram no total consolidado.

Quando um mesmo ativo existe em duas carteiras, o custo médio é calculado separadamente por `portfolio_id + ticker` e somente depois agregado para exibição. Uma venda em uma carteira nunca consome posição de outra.

## Ativação

1. Crie um projeto Supabase.
2. Aplique a migration SQL.
3. Copie `docs/config.js` e preencha somente `supabaseUrl` e `supabaseAnonKey` (chave pública).
4. Configure no Supabase Auth a URL do GitHub Pages como Site URL e Redirect URL.
5. Em um terminal seguro, exporte as variáveis de `.env.example` e execute `node scripts/seed-admin.mjs`.

Nunca grave `SUPABASE_SERVICE_ROLE_KEY` ou senha administrativa no repositório. A senha inicial deve ser trocada após o primeiro acesso.

## Migração do navegador

Depois de entrar e criar uma carteira específica vazia, o cabeçalho oferece **Importar dados locais**. A importação é explícita e envia o histórico e as metas existentes para essa carteira; nada é migrado automaticamente.
