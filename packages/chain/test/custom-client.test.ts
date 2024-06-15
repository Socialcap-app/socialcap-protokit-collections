import { PrivateKey } from "o1js";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { Balances } from "../src/balances";
import { ChainState, ComputedBlockJSON, CustomAppChain } from "../src/custom-app-chain";

log.setLevel("ERROR");

describe("Custom appChain", () => {
  it("configure, run and send txn with a CustomAppChain", async () => {

    // get some test signer info
    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    const tokenId = TokenId.from(0);

    // configure the custom AppChain 
    const appChain = CustomAppChain.fromRuntime({
      Balances,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
      },
      // CAUTION: we need to setup the sequencer URL here if the sequencer 
      // is running in some remote host and not in localhost
      GraphqlClient: {
        url: "http://127.0.0.1:8080/graphql",
      },
    });

    await appChain.start();
    
    // setup the runtimeModule we will use 
    const balances = appChain.runtime.resolve("Balances");

    // CAUTION: we need to setup the signer here because txn.sign() does
    // not accepted any args. Would be good if this can be fixed, and work
    // similar to how the o1js txm.sign() works.
    appChain.setSigner(alicePrivateKey);

    // now we are ready to send the transaction !
    const tx1 = await appChain.transaction(alice, () => {
      balances.addBalance(tokenId, alice, UInt64.from(1000));
    });
    await tx1.sign();
    await tx1.send();

    // wait for the produced block containing this transaction 
    let chainState = await appChain.waitForBlock() as ChainState;
    const block = chainState?.block?.computed as any;
    expect(block.txs[0].status).toBe(true);
    console.log("Transaction: ", JSON.stringify(block.txs[0].tx, null, 2))

    // access the runtimeModule props 
    const key = new BalancesKey({ tokenId, address: alice });
    const balance = await appChain.query.runtime.Balances.balances.get(key);
    expect(balance?.value.toBigInt()).toBe(1000n);
  }, 1_000_000);
});
