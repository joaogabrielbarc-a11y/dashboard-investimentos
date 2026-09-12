# Pondera V3 — múltiplas carteiras no modo local

Esta implementação parte da V3.0.0 e funciona integralmente no navegador, sem login e sem Supabase. O Histórico de Lançamentos continua sendo a fonte das operações de cada carteira. A consolidação é somente leitura.

## 1. Modelo de armazenamento

O catálogo de carteiras fica separado dos dados financeiros:

| Chave | Conteúdo |
| --- | --- |
| **pondera:v3:portfolios** | Cadastro, nome, descrição e flag **includeInConsolidated** |
| **pondera:v3:active-portfolio** | ID da carteira atualmente aberta |
| **pondera:v3:portfolio:\<id\>:state** | Classes, posições, metas e parâmetros |
| **pondera:v3:portfolio:\<id\>:transactions** | Compras, vendas, proventos, ajustes e simulações |
| **pondera:v3:portfolio:\<id\>:patrimony** | Série histórica de patrimônio |
| **pondera:v3:portfolio:\<id\>:planning** | Estado do planejador de aportes |
| **pondera:v3:portfolio:\<id\>:segments** | Metas e bandas por segmento |

As chaves antigas (**carteira-v1**, **carteira-v14-transactions** etc.) são mantidas apenas como compatibilidade para as telas existentes. Ao abrir uma carteira, elas recebem uma cópia do namespace ativo. Ao salvar, o dado é devolvido exclusivamente ao namespace daquele ID.

## 2. Fluxo de uso

1. Na raiz do projeto, execute **python -m http.server 8000 --directory docs**.
2. Abra **http://localhost:8000**.
3. Use **+ Carteira** para criar uma carteira independente.
4. Escolha a carteira no seletor **Carteira ativa**.
5. Faça lançamentos normalmente. A troca de contexto recarrega a tela já apontando para outro namespace.
6. Abra **Patrimônio global**.
7. Marque as carteiras desejadas e clique em **Salvar seleção**.

## 3. Componentes

- **core/local-portfolio-repository.js**: catálogo, migração, criação, troca de contexto e persistência isolada.
- **core/local-consolidation.js**: soma somente snapshots selecionados; agrega patrimônio, classes, posições e proventos.
- **v40-platform.js**: seletor de carteira, formulário de cadastro e modal somente leitura do patrimônio global.

## 4. Migração da base local anterior

Na primeira execução, se existirem dados nas chaves antigas e ainda não houver namespace V3, eles são associados à **Carteira principal**. A migração não duplica dados e não distribui lançamentos automaticamente para outras carteiras.

## 5. Garantias de isolamento

- Cada gravação usa o ID da carteira ativa.
- Uma carteira nova começa sem lançamentos e sem posições.
- A troca de carteira persiste o contexto atual antes de carregar o próximo.
- O consolidado nunca grava em históricos, posições ou metas.
- Ativos iguais em carteiras diferentes são somados apenas na visualização global; os registros de origem permanecem independentes.
