# Pondera — Portfolio Dashboard

Dashboard financeiro publicado em `docs/`, com patrimônio, alocação estruturada,
planejamento de aportes, histórico, proventos e análise quantitativa.

A versão local agora oferece carteiras independentes no próprio navegador e uma
janela de patrimônio global controlada por **includeInConsolidated**. O modelo de
chaves e o fluxo de uso estão documentados em
[docs/LOCAL_MULTI_PORTFOLIO.md](docs/LOCAL_MULTI_PORTFOLIO.md).

A arquitetura multiusuário opcional está documentada em **docs/ARCHITECTURE.md**.
Ela usa Supabase Auth, PostgreSQL com RLS e o mesmo conceito de carteiras
independentes.

O Histórico de Lançamentos é a fonte única dos saldos. Posições, custo médio,
lucro, renda, alocações e métricas são calculados por serviços derivados, sem
duplicar estado entre as abas.

## Front-end estático

```bash
python -m http.server 8000 --directory docs
```

Abra **http://localhost:8000**. Sem **supabaseUrl** e **supabaseAnonKey** em
**docs/config.js**, a aplicação inicia no modo local multi-carteira, sem tela de
login. Os dados anteriores são associados à **Carteira principal** na primeira
execução.

## Banco, autenticação e seed

Consulte `docs/ARCHITECTURE.md` para aplicar a migration em `supabase/migrations/`,
configurar as URLs de autenticação e criar o administrador inicial com variáveis
de ambiente. Senhas e a chave `service_role` nunca devem ser publicadas.

## Aplicação Streamlit legada

## Execução local

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Publicação no Streamlit Community Cloud

1. No Streamlit Community Cloud, crie um app apontando para este repositório.
2. Selecione a branch `main`.
3. Use `app.py` como arquivo principal.
4. Se a Google Sheet for privada, configure os Secrets do app.

## Secrets

No painel de Secrets do Streamlit, use:

```toml
spreadsheet_id = "SEU_ID_DA_PLANILHA"

[gcp_service_account]
type = "service_account"
project_id = "..."
private_key_id = "..."
private_key = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
client_email = "...@....iam.gserviceaccount.com"
client_id = "..."
auth_uri = "https://accounts.google.com/o/oauth2/auth"
token_uri = "https://oauth2.googleapis.com/token"
auth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
client_x509_cert_url = "..."
universe_domain = "googleapis.com"
```

Compartilhe a Google Sheet com o `client_email` da Service Account como leitor.

Se a planilha for publicada para leitura, o app também possui fallback via CSV e pode funcionar sem Service Account.

## Estrutura esperada da planilha

O app usa as abas atuais:

- `Carteira`
- `Análise de Ações`
- `Análise de FIIs`
- `ETFs (Inter) / BTC`
- `Valuation (Stocks)` apenas como fonte da posição de Stocks; nenhum dado de valuation é utilizado.
