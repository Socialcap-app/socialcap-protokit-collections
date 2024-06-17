import { randomInt } from "crypto";
import { PrivateKey, Field, Poseidon } from "o1js";
import { log } from "@proto-kit/common";
import { AppChainCollectionsDispatcher } from "../src/dispatchers"

log.setLevel("ERROR");

describe("Persons", () => {
  it("should demonstrate how Persons collection works", async () => {
    
    // get some test signer info
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    let itemUid = randomInt(10000).toString();

    let dispatcher = new AppChainCollectionsDispatcher('Persons');

    let txn = await dispatcher.dispatchTransaction(alicePrivateKey, {
      action: 'add',
      collection: 'Persons',
      uid: itemUid,
      contentHash: Poseidon.hash([Field(0), Field(1), Field(2), Field(4)]).toString(),
      contentSize: 100,
      updatedBy: "88880001"
    });

    // wait for produced block 
    const chainState = await dispatcher.chain.waitForBlock();
    const block = chainState?.block?.computed as any;
    expect(block.txs[0].status).toBe(true);
    //console.log("Transaction: ", JSON.stringify(block.txs[0].tx, null, 2))

    // check changes top chain
    const storedItem = await dispatcher.chain.query.runtime.Persons.items.get(Field(itemUid));
    expect(storedItem?.uid.toString()).toBe(itemUid.toString());
  }, 1_000_000);
});
