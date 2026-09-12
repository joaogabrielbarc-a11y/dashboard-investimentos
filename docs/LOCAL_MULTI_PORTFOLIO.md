# Pondera V3.2 — múltiplas carteiras no modo local

Esta implementação evolui a V3.1.0 e funciona integralmente no navegador, sem login e sem Supabase. O Histórico de Lançamentos continua sendo a fonte das operações de cada carteira. A consolidação é somente leitura.

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
3. Clique no nome da **Carteira ativa**, ao lado do logotipo, para abrir o gerenciador central.
4. Use **Criar nova carteira**, a engrenagem de edição ou escolha outra carteira da lista.
5. Faça lançamentos normalmente. A troca aplica um snapshot completo da carteira-alvo sem recarregar a página.
6. Abra **Patrimônio global**.
7. Marque as carteiras desejadas e clique em **Salvar seleção**.

## 3. Componentes

- **core/local-portfolio-repository.js**: catálogo, migração, criação, troca de contexto e persistência isolada.
- **core/local-consolidation.js**: soma somente snapshots selecionados; agrega patrimônio, classes, posições e proventos.
- **v42-runtime.js**: bloqueia renders intermediários durante a inicialização e libera uma renderização final única.
- **v40-platform.js**: gerenciador central de carteiras, aplicação atômica do snapshot e modal somente leitura do patrimônio global.

## 4. Taxonomia de ativos

| Entrada recebida | Classe canônica | Segmento padrão |
| --- | --- | --- |
| Tesouro Reserva | Tesouro Direto | Pós-fixado / Selic |

A normalização é aplicada aos lançamentos, às posições e à consolidação global, evitando a criação de uma classe paralela.

## 5. Migração da base local anterior

Na primeira execução, se existirem dados nas chaves antigas e ainda não houver namespace V3, eles são associados à **Carteira principal**. A migração não duplica dados e não distribui lançamentos automaticamente para outras carteiras.

## 6. Garantias de isolamento

- Cada gravação usa o ID da carteira ativa.
- Uma carteira nova começa sem lançamentos e sem posições.
- A troca de carteira persiste o contexto atual e aplica estado, lançamentos, patrimônio, planejamento e segmentos do próximo contexto em uma única transação de interface.
- O consolidado nunca grava em históricos, posições ou metas.
- Ativos iguais em carteiras diferentes são somados apenas na visualização global; os registros de origem permanecem independentes.
