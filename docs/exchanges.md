# Comparativo de Exchanges do RabbitMQ

| Tipo da Exchange      | Exchange Padrão         | Descrição                                                                                  | Vantagens                                                         | Desvantagens                                                     |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| direct                | amq.direct              | Roteia mensagens para filas com routing key exata.                                         | Simples, eficiente para roteamento 1:1 ou 1:N com chave exata.    | Pouco flexível para padrões complexos.                           |
| fanout                | amq.fanout              | Envia mensagens para todas as filas ligadas à exchange.                                    | Broadcast fácil, útil para pub/sub.                               | Não permite filtragem, todas as filas recebem tudo.              |
| topic                 | amq.topic               | Roteia mensagens por padrão de routing key com curingas (`*`, `#`).                        | Flexível, permite roteamento complexo e granularidade por padrão. | Pode ser mais difícil de configurar e entender.                  |
| headers               | amq.headers             | Roteia mensagens baseado em headers (chave/valor) em vez de routing key.                   | Permite filtragem avançada e múltiplos critérios de roteamento.   | Mais pesado, menos performático, configuração mais detalhada.    |
| default (nameless)    | (sem nome)              | Exchange interna usada ao publicar direto para uma fila (routing key = nome da fila).      | Simples para uso direto, não precisa declarar exchange.           | Sem roteamento avançado, só entrega direto para a fila indicada. |

---

#### Sobre as exchanges especiais

- **amq.match**:  
  Exchange do tipo "match", similar à headers, mas com lógica de correspondência diferente. É considerada legada e não recomendada para novos projetos. Pode não estar habilitada em instalações recentes do RabbitMQ.

- **amq.rabbitmq.trace**:  
  Exchange interna usada para rastrear todas as mensagens roteadas pelo broker. É útil para debug e auditoria, mas não deve ser usada para aplicações normais, pois pode gerar grande volume de dados e afetar a performance.

---

## Quando usar as exchanges existentes e quando criar novas exchanges

- **Use as exchanges padrão (`amq.direct`, `amq.fanout`, `amq.topic`, `amq.headers`)** quando:
  - O padrão de roteamento desejado já é atendido por um dos tipos existentes.
  - Você quer simplicidade e interoperabilidade com ferramentas e bibliotecas.
  - Não há necessidade de isolamento entre aplicações ou domínios.
  - O volume de mensagens e filas pode ser facilmente gerenciado por uma exchange compartilhada.

- **Crie novas exchanges** (com nomes próprios) quando:
  - Precisa de isolamento lógico entre aplicações, ambientes (dev/prod), ou domínios de negócio.
  - Deseja aplicar políticas específicas (ex: TTL, DLX, quotas) apenas para um conjunto de filas/mensagens.
  - Quer evitar conflitos de routing key ou filas entre diferentes aplicações.
  - Precisa de controle mais granular sobre permissões de acesso (vhosts, usuários).
  - Vai implementar integrações multi-tenant ou SaaS, onde cada cliente pode ter sua própria exchange.

Em geral, para aplicações pequenas ou protótipos, as exchanges padrão são suficientes. Para sistemas maiores, multiusuário ou com requisitos de segurança e isolamento, criar exchanges nomeadas é a melhor prática.
