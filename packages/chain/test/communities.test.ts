import { randomInt } from "crypto";
import { PrivateKey, Field, Poseidon } from "o1js";
import { TestingAppChain } from "@proto-kit/sdk";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64, UInt32 } from "@proto-kit/library";
import { CustomAppChain } from "../src/custom-app-chain";
import { Communities } from "../src/collections";

log.setLevel("ERROR");

describe("communities", () => {
  it("should demonstrate how Communities collection works", async () => {
    
    // get some test signer info
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    // configure the custom AppChain 
    const appChain = CustomAppChain.fromRuntime({
      Communities,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
          },
        Communities: {}
      },
      // CAUTION: we need to setup the sequencer URL here if the sequencer 
      // is running in some remote host and not in localhost
      GraphqlClient: {
        url: "http://127.0.0.1:8080/graphql",
      },
    });

    await appChain.start();

    // setup runtimeModule and send transaction
    const communities = appChain.runtime.resolve("Communities");

    appChain.setSigner(alicePrivateKey);

    const itemUid = Field(randomInt(10000)); 
    const tx1 = await appChain.transaction(
      alice, 
      () => {
        communities.addItem(
          itemUid,
          Poseidon.hash([Field(0), Field(1), Field(2), Field(4)]),
          UInt32.from(120),
          Field('88880001')
        );
      }
    );
    await tx1.sign();
    await tx1.send();

    // wait for produced block 
    const chainState = await appChain.waitForBlock();
    const block = chainState?.block?.computed as any;
    expect(block.txs[0].status).toBe(true);
    // console.log("Transaction: ", JSON.stringify(block.txs[0].tx, null, 2))

    // check changes top chain
    const storedItem = await appChain.query.runtime.Communities.items.get(itemUid);
    expect(storedItem?.uid.toString()).toBe(itemUid.toString());
  }, 1_000_000);
});
