//não usar este exemplo
import amqp from 'amqplib';

async function publishWithTransaction() {
  const conn = await amqp.connect('amqp://localhost');
  const channel = await conn.createChannel();


  // 1. Ativar modo de transação
  await channel.txSelect();

  try {
    // 2. Publicar mensagens dentro da transação
    await channel.publish('exchange','routingKey', Buffer.from('Mensagem 1'));

    // 3. Confirmar a transação (força fsync no broker)
    //bloqueante
    await channel.txCommit(); //a msg será enfileirada na fila (fsync)
    console.log('Mensagens confirmadas no disco.');
  } catch (error) {
    console.error('Erro na transação, revertendo...', error);
    
    // 4. Se algo falhar, desfaz a transação
    await channel.txRollback();
  } finally {
    await channel.close();
    await conn.close();
  }
}

publishWithTransaction();
