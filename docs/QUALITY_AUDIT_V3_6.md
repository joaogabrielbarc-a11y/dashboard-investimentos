# Auditoria de qualidade — Pondera V3.6.0

Data: 13/09/2026

## Escopo

A auditoria cobriu a hierarquia da Alocação Estruturada, troca de carteiras, persistência local, cálculos financeiros, métricas quantitativas, cotações automáticas e contenção responsiva.

## Inconsistências encontradas e corrigidas

| Área | Inconsistência | Correção |
|---|---|---|
| Alocação | A correção de ordem só atuava em nós que já estavam no contêiner esperado e podia ocorrer 230 ms após a renderização. | Macro e Micro são reparentadas e ordenadas de forma síncrona antes de a interface ser liberada. |
| Transição | A troca atômica ainda ocultava visualmente toda a página por dois frames. | O snapshot continua bloqueado para interação, mas permanece visível e é liberado em uma microtarefa. |
| Armazenamento | Falhas de `localStorage` podiam interromper a persistência sem diagnóstico amigável. | A gravação passa a emitir estado, evento e mensagem de erro sem derrubar o dashboard. |
| Integridade | Não existia uma verificação conjunta de IDs, carteira ativa e datasets por namespace. | Foi adicionado `auditIntegrity()`, que detecta IDs duplicados, carteira ativa inválida e JSON corrompido. |
| Quantitativa | Sharpe e Sortino descontavam uma Selic corrente constante, mesmo havendo série histórica de CDI. | A taxa livre de risco diária agora é alinhada pela data do CDI; a Selic corrente é apenas fallback. |
| Cotações | A verificação podia terminar antes do fallback no navegador e falhas apareciam apenas no console. | A cadeia é aguardada até o fim, preserva o último preço válido e publica estados `fresh`, `cached` e `error`. |
| Atualização manual | “Verificar agora” não ignorava o prazo do cache e podia iniciar uma segunda execução concorrente. | A ação força a revalidação de todos os tickers elegíveis e chamadas simultâneas são deduplicadas. |
| Responsividade | Tabelas largas e textos longos podiam forçar overflow horizontal. | Contêineres recebem contenção, quebra de texto e rolagem horizontal localizada. |
| Conteúdo dinâmico | Um fallback legado gerava a entidade de aspas sem o terminador `;`. | O escape HTML foi corrigido para manter atributos e textos dinâmicos bem formados. |
| Observabilidade | Erros de DOM, valores não finitos e overflow não eram auditáveis em execução. | O módulo V45 registra e expõe um relatório único em `PonderaQualityAuditV45.report()`. |

## Garantias verificadas

- Macro Alocação é sempre anterior à Micro Alocação no DOM e na ordem CSS.
- A ordem não depende da carteira, das classes cadastradas ou da quantidade de posições.
- Cada carteira permanece isolada em `pondera:v3:portfolio:<id>:<dataset>`.
- Carteira e consolidação vazias retornam zero, sem `NaN`, `Infinity` ou divisão por zero.
- A troca de carteira não usa recarga de página nem reexecuta a pilha histórica.
- Uma falha temporária de cotação não substitui um preço válido já armazenado.

## Auditoria em execução

No console do navegador:

```js
PonderaQualityAuditV45.report()
```

O resultado reúne verificações de hierarquia, interface, armazenamento, cálculos, responsividade, cotações e exceções capturadas.

## Compatibilidade

A inicialização ainda carrega camadas legadas por compatibilidade com a base histórica. Essa sequência ocorre uma única vez, antes do estado `ready`; a troca entre carteiras não recarrega nem reproduz essas versões. Nenhum esquema ou dado de carteira foi alterado.
