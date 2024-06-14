import { PrivateKey } from "o1js";
import { log } from "@proto-kit/common";
import { ClientAppChain, InMemorySigner } from "@proto-kit/sdk";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";
import { Balances } from "../src/balances";

log.setLevel("ERROR");

describe("balances", () => {
  it("try to run a ClientAppChain", async () => {

    const appChain = ClientAppChain.fromRuntime({
      Balances,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
      },
    });

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();
    const tokenId = TokenId.from(0);

    await appChain.start();

    (appChain as any).container
      .resolveOrFail('Signer', InMemorySigner)
      .setSigner(alicePrivateKey);

    const balances = appChain.runtime.resolve("Balances");

    const tx1 = await appChain.transaction(alice, () => {
      balances.addBalance(tokenId, alice, UInt64.from(1000));
    });

    await tx1.sign();
    await tx1.send();
  }, 1_000_000);
});
