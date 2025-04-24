# Exemplo: Topic Exchange com RabbitMQ

Este exemplo demonstra o uso de uma exchange do tipo **topic** no RabbitMQ, com múltiplas filas e diferentes padrões de routing key.

### Routing keys publicadas:

- `order.created`
- `order.paid`
- `order.shipped.economy`
- `order.shipped.express`

### Filas e bindings:

| Fila                   | Binding key  | Explicação                                     |
| ---------------------- | ------------ | ---------------------------------------------- |
| `log-all-orders-queue` | `order.#`    | Recebe **tudo** relacionado a pedidos          |
| `nfe-queue`            | `order.paid` | Apenas pedidos pagos                           |
| `email-queue`          | `order.*.*`  | Apenas pedidos com envio (economy ou express)  |
| `catch-all-queue`      | `#`          | Recebe **qualquer mensagem**, de qualquer tipo |

---

### ✅ O que vai acontecer:

| Routing Key             | Vai para...                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `order.created`         | `log-all-orders-queue`, `catch-all-queue`, `email-queue`              |
| `order.paid`            | `log-all-orders-queue`, `nfe-queue`, `catch-all-queue`, `email-queue` |
| `order.shipped.economy` | `log-all-orders-queue`, `email-queue`, `catch-all-queue`              |
| `order.shipped.express` | `log-all-orders-queue`, `email-queue`, `catch-all-queue`              |

---

## Como executar

1. **Inicie o RabbitMQ** localmente.
2. Execute cada consumer em um terminal separado:
   - `log-all-orders-consumer.ts`
   - `only-paid-orders-consumer.ts`
   - `only-shipping-types-consumer.ts`
   - `catch-all-consumer.ts`
3. Execute o publisher:
   - `publisher.ts`
