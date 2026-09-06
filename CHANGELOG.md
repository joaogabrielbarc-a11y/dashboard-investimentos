# Histórico de versões

A partir da V2.4.1, toda alteração solicitada para o dashboard deve ser registrada com versão, data, área, motivação, alterações realizadas e impacto nos dados.

## Política de versionamento

- **MAJOR**: mudança estrutural incompatível ou reconstrução relevante da arquitetura.
- **MINOR**: nova funcionalidade ou evolução relevante mantendo compatibilidade.
- **PATCH**: correção, refinamento visual, ajuste de lógica ou comportamento sem mudança estrutural dos dados.

O histórico estruturado e legível por máquina fica em `revision-history.json`. A cópia publicada pelo GitHub Pages fica em `docs/revision-history.json`.

## V2.14.0 — 2026-09-07

**Área:** Alocação estruturada e Patrimônio
**Tipo:** Minor

### Correções e melhorias
- A edição de ativos agora persiste nome, classe, segmento e meta de micro alocação na fonte de verdade da carteira.
- A classificação editada é sincronizada com os lançamentos do mesmo ticker, impedindo que a reconstrução do patrimônio restaure o valor antigo.
- O editor de ativo ganhou abertura e salvamento delegados, tolerantes às reconstruções frequentes da interface.
- As sugestões de segmento acompanham a classe escolhida e incluem segmentos planejados e já utilizados.
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
