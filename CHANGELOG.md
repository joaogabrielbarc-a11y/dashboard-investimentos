# Histórico de versões

A partir da V2.4.1, toda alteração solicitada para o dashboard deve ser registrada com versão, data, área, motivação, alterações realizadas e impacto nos dados.

## Política de versionamento

- **MAJOR**: mudança estrutural incompatível ou reconstrução relevante da arquitetura.
- **MINOR**: nova funcionalidade ou evolução relevante mantendo compatibilidade.
- **PATCH**: correção, refinamento visual, ajuste de lógica ou comportamento sem mudança estrutural dos dados.

O histórico estruturado e legível por máquina fica em `revision-history.json`. A cópia publicada pelo GitHub Pages fica em `docs/revision-history.json`.

## V2.20.0 — 2026-09-07

**Área:** Análise Quantitativa
**Tipo:** Minor

### Correções e melhorias
- A barra superior mantém somente Sharpe, Sortino e o novo YTM/TIR anualizado da carteira.
- Rentabilidade acumulada, retorno anualizado e drawdown máximo foram integrados ao card do gráfico de retorno.
- Foi criado um gráfico próprio de volatilidade histórica móvel, acompanhado da volatilidade atual em uma janela de 21 pregões.
- Os dois gráficos permitem alternar entre carteira, classes, segmentos e ativos, com seleção individual ou comparação das principais séries.
- Posições, classes, segmentos e ativos agora são derivados exclusivamente do Histórico de Lançamentos.
- Um único processamento inicial consolida todas as séries, decomposições, matrizes, métricas e rankings; os filtros não refazem consultas nem cálculos históricos.
- O pacote calculado continua protegido pelo cache diário e é invalidado quando qualquer lançamento ou classificação histórica muda.

### Impacto nos dados
- Nenhum lançamento, posição, meta ou banda foi alterado.
- Foi criada apenas uma nova versão do cache derivado das análises.

## V2.19.0 — 2026-09-07

**Área:** Análise Quantitativa
**Tipo:** Minor

### Correções e melhorias
- Grid, espaçamentos, alturas e padding dos cards foram alinhados ao ritmo visual das abas Patrimônio, Alocação e Proventos.
- Tipografia operacional passou a usar a mesma escala legível das demais abas, eliminando textos de 8–10 px na área quantitativa.
- Indicadores macro, curva de juros, gráfico de retorno e matriz de correlação receberam dimensões e pontos de quebra responsivos consistentes.
- As bases de preços, câmbio e indicadores agora permanecem em cache local por 24 horas, com recuperação do último dado válido em falhas temporárias.
- Os parâmetros calculados de retorno e risco também são reutilizados por 24 horas e invalidados imediatamente quando o histórico de lançamentos muda.
- A automação de mercado foi reduzida de múltiplas execuções intradiárias para uma consolidação diária após o fechamento dos mercados.

### Impacto nos dados
- Nenhum lançamento, posição, meta ou banda foi alterado.
- Foram adicionadas somente chaves locais de cache derivado; não existe migração de dados da carteira.

## V2.18.0 — 2026-09-07

**Área:** Alocação estruturada e Análise Quantitativa
**Tipo:** Minor

### Correções e melhorias
- A entrada da Alocação estruturada agora mantém cabeçalho e conteúdo ocultos durante a estabilização e revela toda a aba em uma única transição curta.
- Foi criada a aba Análise Quantitativa, integrada ao histórico de lançamentos executados e às séries de preços ajustados em reais.
- A nova área calcula retorno ponderado pelo tempo, retorno anualizado, volatilidade, drawdown máximo, Sharpe e Sortino.
- Compras e vendas são tratadas como fluxos e não como rentabilidade; métricas com menos de 30 pregões não são exibidas.
- Foi adicionada uma matriz de correlação de Pearson entre classes com histórico comum suficiente.
- A área macro reúne USD/BRL, Selic, IPCA em 12 meses, Fed Funds e curvas nominal e real dos títulos públicos brasileiros.
- O atualizador em Python passa a preparar dois anos de preços ajustados e a coletar dados do Banco Central, Federal Reserve e Tesouro Transparente.
- Ativos em dólar são convertidos diariamente para reais antes dos cálculos e a aba informa sua cobertura histórica.

### Impacto nos dados
- Nenhum lançamento, posição, meta ou banda foi alterado.
- Foi adicionado apenas um arquivo derivado de séries históricas de mercado, renovado pelo fluxo automático de preços.

## V2.17.0 — 2026-09-07

**Área:** Patrimônio e Proventos
**Tipo:** Minor

### Correções e melhorias
- O valor e o percentual do lucro total passam a ser renderizados juntos na carga estável da aba Patrimônio.
- A base de proventos é pré-carregada uma única vez e compartilhada entre os componentes, eliminando resultados intermediários divergentes.
- Gráfico, indicadores, distribuição por classe e lista usam a mesma consolidação de proventos.
- As quantidades elegíveis são reconstruídas exclusivamente pelos lançamentos executados até a data de corte de cada evento, inclusive para ativos já encerrados.
- Eventos duplicados da base são eliminados antes da consolidação.
- A lista de proventos ganhou paginação de 15 itens, navegação entre páginas e total de registros.
- Espaçamentos, alturas, margens e comportamento responsivo dos cards foram padronizados com as demais abas.
- Foi incluída uma auditoria interna de fonte histórica, duplicidades, paginação, controles e unicidade dos componentes.

### Impacto nos dados
- Nenhum lançamento, posição ou meta foi alterado.
- A consolidação histórica pode mudar valores antes estimados pela posição atual, pois agora respeita integralmente compras e vendas registradas em cada data de corte.

## V2.16.0 — 2026-09-07

**Área:** Aportes & lançamentos
**Tipo:** Minor

### Melhorias
- O indicador “Ideal do segmento” foi compactado para ocupar apenas o espaço necessário dentro da janela de lançamento.
- As sugestões de venda agora começam pelas posições ligadas às classes ou segmentos com maior desvio acima da banda.
- O valor sugerido para venda permanece separado do orçamento de aporte e não altera automaticamente a distribuição planejada.
- Foi incluída a ação opcional “Somar ao aporte” para reinvestir o total sugerido somente quando o usuário decidir.

### Impacto nos dados
- Nenhuma venda é executada automaticamente.
- O orçamento só é alterado quando o usuário aciona “Somar ao aporte”.
- Nenhuma posição, lançamento, meta ou chave de armazenamento existente foi migrada.

## V2.15.1 — 2026-09-07

**Área:** Aportes & lançamentos
**Tipo:** Patch

### Correção
- A camada antiga do planejador não pode mais sobrescrever a Distribuição planejada estável após uma troca de aba ou renderização geral.
- A estrutura atual se autocorrige caso detecte ausência do campo de orçamento ou divergência na quantidade de classes.
- As referências de cache do planejador foram renovadas.
- Nenhum dado da carteira foi alterado.

## V2.15.0 — 2026-09-07

**Área:** Aportes & lançamentos
**Tipo:** Minor

### Correções e melhorias
- A seção Distribuição planejada mantém a mesma estrutura ao entrar na aba e ao alterar o orçamento, eliminando o efeito de apagar e reaparecer.
- A digitação do aporte atualiza os valores calculados pontualmente, preservando foco, expansão e posição visual.
- A janela de lançamento passa a mostrar somente o Ideal do segmento, sem os cartões Já simulado e Falta.
- Quando o aporte é menor que 1% do patrimônio, o planejador avalia classes e segmentos acima da faixa superior e calcula a venda necessária para retornar à banda.
- As vendas são apresentadas como sugestões por ativo e podem ser abertas, já preenchidas, na simulação de lançamentos.
- A lógica considera vendas já simuladas, posições em BRL e USD e títulos de renda fixa tratados como posições inteiras.
- A regra é estrita: aporte igual ou superior a 1% não gera venda; classes e segmentos dentro ou abaixo da banda também não geram venda.

### Impacto nos dados
- Nenhum lançamento é executado automaticamente: a venda sugerida precisa ser revisada e adicionada à simulação.
- Nenhuma chave de `localStorage`, posição, lançamento ou meta existente foi migrada.

## V2.14.0 — 2026-09-07

**Área:** Alocação estruturada e Patrimônio
**Tipo:** Minor

### Correções e melhorias
- A edição de ativos agora persiste nome, classe, segmento e meta de micro alocação na fonte de verdade da carteira.
- A classificação editada é sincronizada com os lançamentos do mesmo ticker, impedindo que a reconstrução do patrimônio restaure o valor antigo.
- O editor de ativo ganhou abertura e salvamento delegados, tolerantes às reconstruções frequentes da interface.
- As sugestões de segmento acompanham a classe escolhida e incluem segmentos planejados e já utilizados.
- Renomear um segmento pela tabela setorial agora atualiza também os lançamentos dos ativos afetados.
- A ação antes chamada “Excluir” nos ativos passou a “Encerrar” e prepara uma venda total na simulação, preservando o histórico.
- Classes com posições ativas não podem mais ser excluídas antes da realocação ou do encerramento dos ativos vinculados.
- O card “Lucro total” agora mostra também quanto o lucro representa do patrimônio atual.
- Foi adicionada uma auditoria funcional interna para conferir cobertura de classes, ativos, controles, editores, identificadores e renderização válida.
- A aba foi revisada para carteiras com múltiplas classes, classes sem posição, segmentos planejados sem ativos e posições em BRL ou USD.

### Impacto nos dados
- Nenhum dado é migrado automaticamente ao carregar a versão.
- Ao salvar a edição de um ativo, seus metadados são atualizados nos lançamentos do mesmo ticker para manter toda a carteira consistente.

## V2.13.1 — 2026-09-06

**Área:** Alocação estruturada
**Tipo:** Patch

### Ajustes
- O donut de micro alocação foi substituído por uma barra horizontal de composição em 100%.
- Cada faixa representa proporcionalmente o peso real do segmento.
- As faixas maiores exibem o nome e o percentual diretamente no gráfico.
- A legenda compacta mantém peso real, alvo e status para todos os segmentos.
- Segmentos pequenos ou zerados continuam identificados sem distorcer a escala do gráfico.
- O botão de minimizar e o comportamento responsivo foram preservados.
- Nenhum dado da carteira foi alterado.

## V2.13.0 — 2026-09-04

**Área:** Patrimônio e Alocação estruturada
**Tipo:** Minor

### Ajustes
- A visão gráfica da macro alocação ganhou mais espaço, com redução proporcional da área da tabela.
- “Ativos na Carteira” foi renomeado para “Resumo da carteira”.
- O resumo agora permite navegar em três níveis: Macro, Segmentos e Ativos.
- Clicar em uma classe abre sua distribuição por segmentos; clicar em um segmento abre os ativos correspondentes.
- Controles de nível, seletor de classe, contexto atual e botão de retorno mantêm a navegação clara.
- Nenhuma posição, lançamento, meta ou chave de `localStorage` foi migrada.

## V2.12.4 — 2026-09-04

**Área:** Alocação estruturada
**Tipo:** Patch

### Ajustes
- A Banda geral ganhou dimensionamento próprio para exibir o percentual completo.
- A coluna Meta não herda mais o limite antigo de 88 px e passa a exibir o botão `+` integralmente.
- Cada Distribuição setorial mostra a soma dos alvos ao lado de “+ Segmento”.
- O total setorial muda de status conforme a soma esteja ou não em 100% e é atualizado imediatamente.
- Nenhum dado existente ou chave de `localStorage` foi alterado.

## V2.12.3 — 2026-09-04

**Área:** Alocação estruturada
**Tipo:** Patch

### Ajustes
- Alterações percentuais passam a atualizar somente as células e indicadores dependentes, sem apagar e recriar a seção.
- O seletor mantém foco e posição enquanto faixa, status, totais e gráficos são atualizados.
- A coluna Meta reserva espaço para `−`, percentual, `%` e `+`, evitando o corte do botão de aumento.
- O sinal `±` antigo foi removido dos campos de banda.
- Valores com um, dois ou três dígitos permanecem centralizados.
- Nenhum dado existente ou chave de `localStorage` foi alterado.

## V2.12.2 — 2026-09-04

**Área:** Alocação estruturada
**Tipo:** Patch

### Correção
- O renderizador-base não interrompe mais a atualização ao encontrar campos legados removidos pela interface atual.
- A cadeia antiga de scripts não é mais carregada em paralelo com o bootstrap estável.
- Os controles `− / percentual / +` agora atualizam faixas, status, totais e gráficos a cada clique.
- As referências de cache dos arquivos corrigidos foram renovadas, sem migração de dados.

## V2.12.1 — 2026-09-04

**Área:** Alocação estruturada
**Tipo:** Patch

### Correção
- Os seletores agora atualizam diretamente o modelo de metas e bandas antes do novo `render()`.
- Faixas, status, totais e gráficos passam a refletir cada clique imediatamente.
- A correção cobre macro alocação, banda geral, bandas por classe e metas por segmento.
- Nenhum dado existente ou chave de `localStorage` foi migrado.

## V2.12.0 — 2026-09-04

**Área:** Alocação estruturada
**Tipo:** Minor

### Solicitação
Adicionar controles `−` e `+` em todos os ajustes percentuais da aba, sempre em passos de 1 ponto percentual, com recálculo automático dos indicadores dependentes.

### Alterações
- Os controles de meta macro, banda geral, bandas por classe e metas por segmento receberam seletores `− / percentual / +`.
- Cada clique altera exatamente 1 p.p.
- Faixas, status, totais de metas, gráficos e indicadores são atualizados imediatamente.
- A digitação manual também passa a ser aplicada automaticamente sem exigir a saída do campo.
- Os diálogos relacionados à alocação usam o mesmo padrão visual.
- Nenhuma chave de `localStorage`, posição, lançamento ou meta existente foi migrada ou apagada.

## V2.4.1 — 2026-09-02

**Área:** Patrimônio  
**Tipo:** Patch

### Solicitação
Garantir a ordem visual da aba Patrimônio como:

1. KPIs — Patrimônio total, Lucro total e Proventos;
2. Ativos na Carteira;
3. Evolução do Patrimônio.

### Motivação
A versão publicada em dispositivos móveis ainda podia exibir os gráficos antes dos KPIs. A lógica de ordenação existia, mas a cadeia de carregamento podia permanecer presa ao cache anterior do `v21.js`.

### Alterações
- A camada patrimonial passou a ser carregada diretamente pelo `index.html` com versão de cache própria.
- A ordenação da aba passou a ser revalidada durante a inicialização e após mutações do DOM.
- O identificador visual passou a mostrar `V2.4.1`.
- Nenhuma chave de `localStorage`, posição, lançamento, meta ou dado da carteira foi migrado ou apagado.

## V2.4.0 — baseline

Versão-base da visão executiva de Patrimônio com os três KPIs, gráfico de composição da carteira e evolução patrimonial.
