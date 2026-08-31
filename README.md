# Dashboard online — Consolidação e Balanceamento

Aplicação Streamlit focada exclusivamente em:

- consolidação da carteira;
- pesos atuais x pesos-alvo;
- bandas de rebalanceamento;
- simulação e dimensionamento do próximo aporte;
- balanceamento interno de Ações BR e FIIs;
- pesos internos dos ETFs internacionais;
- concentração por ativo.

Não há valuation, Sharpe, beta, volatilidade ou análise de performance.

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
