# Arquitetura de dados de mercado do Pondera

## Contrato estável

`scripts/market_data/base.py` define `BaseMarketDataProvider`, o contrato comum dos adaptadores:

- `getLatestPrices(tickers)`: último preço e data de referência;
- `getHistoricalData(ticker, timeframe)`: preços ajustados, proventos e desdobramentos;
- `getEconomicIndicators()`: séries macroeconômicas.

Os métodos Python em `snake_case` possuem aliases públicos em `camelCase`. Uma falha de provedor gera `ProviderError`, recuperável pelo roteador.

## Roteamento e fallback

`MarketDataRouter` recebe uma cadeia ordenada por classe. A configuração atual é:

| Classe | Primário | Fallback |
|---|---|---|
| B3 | brapi ou UP2DATA quando configurado | Yahoo Finance `.SA` |
| Internacional | Yahoo Finance | último snapshot válido |
| Cripto | Yahoo Finance | último snapshot válido |
| Tesouro Direto | Tesouro Transparente | último snapshot válido |
| Tesouro Reserva e indicadores | Banco Central SGS | último snapshot válido |
| Fundos tradicionais | CVM Informe Diário | última cota válida |

`BRAPI_TOKEN` ativa brapi sem mudança no pipeline. `UP2DATA_ENDPOINT` e `UP2DATA_TOKEN` reservam o encaixe do contrato B3; o mapeamento definitivo do payload será concluído quando as credenciais e a especificação contratada estiverem disponíveis. Chaves nunca são enviadas ao navegador.

## Pipeline

1. O GitHub Actions executa `scripts/update_prices.py` após o fechamento dos mercados.
2. O roteador consulta cada classe e registra tentativas, fonte, quantidade de pontos e erros.
3. Séries internacionais e o S&P 500 são convertidos para BRL com o câmbio diário.
4. Os snapshots novos são mesclados ao último valor válido; uma indisponibilidade não zera posições.
5. O resultado estático é publicado em `prices.json`, `market-indexes.json`, `fund-prices.json` e `quant-market-history.json`.
6. `validate_quantitative_data.py` valida cobertura e calcula volatilidade, Sharpe, Sortino e Beta sobre séries reais.

O navegador consulta apenas os snapshots do próprio domínio, com cache diário e fallback local expirado. Não há chamada direta do cliente aos provedores.

## Histórico

`quant-market-history.json` preserva `prices`, usado pelas versões anteriores, e acrescenta:

- `schemaVersion: 2`;
- janela `5y` ou desde o início do ativo;
- `benchmarks`: IBOV, XFIX11 como proxy gratuito do IFIX, S&P 500 em BRL e CDI acumulado;
- `seriesMetadata`: fonte, moeda, ajuste e cobertura;
- `providerDiagnostics`: trilha das tentativas e fallbacks.

O fechamento ajustado é usado para ações, ETFs, FIIs e BDRs. Tesouro utiliza preços oficiais. CDI é composto pelas taxas diárias da série SGS 12. Fundos tradicionais são identificados pelo CNPJ sem pontuação; `PONDERA_FUND_CNPJS` permite incluir novos fundos no coletor agendado.

## Evolução para escala

O roteador separa o produto do fornecedor. Para migrar a produção, basta concluir o adaptador contratado e colocá-lo antes do Yahoo na cadeia. Em uma infraestrutura multiusuário, os mesmos adaptadores podem alimentar PostgreSQL/Timescale e Redis/CDN sem alterar o formato consumido pela análise quantitativa.
