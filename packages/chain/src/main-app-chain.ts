import { ManualBlockTrigger } from '@proto-kit/sequencer';
import appChain from "./chain.config";
import { exit } from 'process';
import { log } from "@proto-kit/common";

log.setLevel("INFO");

const DELAY = 5000; // ms

await appChain.start();

const trigger = appChain.sequencer.resolveOrFail(
  'BlockTrigger',
  ManualBlockTrigger,
);

setInterval(async () => {
  // console.log(`Waiting for ${DELAY/1000} secs`);
  try {
    await trigger.produceUnproven();
  } catch (e) {
    console.error('Run err', e);
  }
}, DELAY);