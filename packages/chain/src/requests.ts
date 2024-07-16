import 'dotenv/config';
import { connect, JSONCodec, NatsConnection } from "nats";

// const NATS_SERVER_WSS = "wss://nats.socialcap.dev:4233";
const NATS_SERVER = process.env.NATS_SERVER;

export {
  type Response,
  postMessage,
}

interface Response {
  success: boolean;
  data: object | null;
  error: any | null;
}


/**
 * Sends a request to 'socialcap:semaphore' and waits for a response.
*/
async function postMessage(params: object): Promise<Response> {
  // setup codec
  const codec = JSONCodec();

  // the NATS subject where we will publish it
  const natsSubject = `socialcap:collections`;

  // connect to the NATS server and send a 'ready' request
  const nc = await connect({ 
    servers: NATS_SERVER,
    timeout: 5*60*1000, 
    debug: false 
  });
  console.debug(`postRequest connected to ${NATS_SERVER}`);

  try {
    await nc.publish(
      natsSubject, 
      codec.encode(params),
    )
    return { success: true, data: {}, error: null }
  }
  catch (error: any) {
    console.debug(`postRequest ${params} error: `, error);
    return { success: false, data: null, error: error.message }
  }
  finally {
    // disconect and clean all pendings
    console.debug("postRequest cleanup (drained)");
    await nc.drain();
  }
}
