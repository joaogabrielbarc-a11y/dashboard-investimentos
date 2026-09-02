# Histórico de versões

A partir da V2.4.1, toda alteração solicitada para o dashboard deve ser registrada com versão, data, área, motivação, alterações realizadas e impacto nos dados.

## Política de versionamento

- **MAJOR**: mudança estrutural incompatível ou reconstrução relevante da arquitetura.
- **MINOR**: nova funcionalidade ou evolução relevante mantendo compatibilidade.
- **PATCH**: correção, refinamento visual, ajuste de lógica ou comportamento sem mudança estrutural dos dados.

O histórico estruturado e legível por máquina fica em `revision-history.json`. A cópia publicada pelo GitHub Pages fica em `docs/revision-history.json`.

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
