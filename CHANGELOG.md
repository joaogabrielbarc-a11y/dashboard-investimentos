# Histórico de versões

A partir da V2.4.1, toda alteração solicitada para o dashboard deve ser registrada com versão, data, área, motivação, alterações realizadas e impacto nos dados.

## Política de versionamento

- **MAJOR**: mudança estrutural incompatível ou reconstrução relevante da arquitetura.
- **MINOR**: nova funcionalidade ou evolução relevante mantendo compatibilidade.
- **PATCH**: correção, refinamento visual, ajuste de lógica ou comportamento sem mudança estrutural dos dados.

O histórico estruturado e legível por máquina fica em `revision-history.json`. A cópia publicada pelo GitHub Pages fica em `docs/revision-history.json`.

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
