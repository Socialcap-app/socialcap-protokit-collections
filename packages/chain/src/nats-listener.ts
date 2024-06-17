import 'dotenv/config';
import { PrivateKey } from 'o1js';
import { connect, JSONCodec, NatsConnection } from 'nats';
import { CollectionNotification } from './types/notification';
import { AppChainCollectionsDispatcher } from './dispatchers';

// Create a JSON codec for encoding and decoding messages
const codec = JSONCodec();

const logger = console;

async function handleMessage(
  connection: NatsConnection, 
  data: any
) {
  logger.debug(`handleMessage data: `, data);

  // process the received notification and create a Protokit transaction
  const dispatcher = new AppChainCollectionsDispatcher(data.collection);

  let txn = await dispatcher.dispatchTransaction(
    PrivateKey.random(),
    data as CollectionNotification
  );

  let chainState = await dispatcher.chain.waitForBlock();
  const block = chainState?.block?.computed as any;
  console.log("Transaction: ", JSON.stringify(block.txs[0].tx, null, 2))

  // now republish message according to scope
  let redirectedSubject = `socialcap:${data.scope}${
    data.scope === 'all' ? '' : '.'+(data.subject || 'none')
  }`;
  
  await connection.publish(
    redirectedSubject, 
    codec.encode(data)
  );
  logger.info(`Redirected message to: ${redirectedSubject}`)
}

function listen(
  connection: NatsConnection, 
  subject: string, 
  handleMessage: (nc: NatsConnection, data: any) => void
) {
  // Subscribe to the subject
  const subscription = connection.subscribe(subject);
  logger.info(`NATS listener subscribed subject: '${subject}'`);

  // Process messages received on the subscribed subject
  (async () => {
    for await (const msg of subscription) {
      try {
        const data = codec.decode(msg.data);
        logger.info(`Received message on subject '${subject}': `
          +`${JSON.stringify(data)}`);

        // Perform processing logic here
        await handleMessage(connection, data);
      }
      catch (err) {
        logger.error('Error processing message: ', err);
      }
    }
  })();
}

async function start() {
  try {
    // connect to the NATS server
    const nc = await connect({
      servers: process.env.NATS_SERVER as string, 
    });
    logger.info(`NATS listener connected: ${process.env.NATS_SERVER}`);

    // listen to Collections insert and updates
    listen(nc, "socialcap:collections", handleMessage);
    logger.info(`NATS listener subscribed and listening ...`);
  } catch (error) {
    logger.error('Error connecting to NATS server:', error);
  }
}

// Start the NATSClient
start();
