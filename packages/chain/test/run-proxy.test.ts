import { ClientAppChain, InMemorySigner } from "@proto-kit/sdk";
import { PrivateKey } from "o1js";
import { container } from "tsyringe";
import { Balance, TokenId } from "@proto-kit/library";
import { modules } from "./../src/runtime";
import { Balances } from "../src/balances";
import { Collection, Communities } from "../src/collections";


export async function start() {
  const chain = ClientAppChain.fromRuntime(modules);
  const signer = new InMemorySigner();

  const alicePrivateKey = PrivateKey.random();
  const alice = alicePrivateKey.toPublicKey();

  chain.configurePartial({
    Runtime: {
      Balances: {
        totalSupply: Balance.from(1000000),
      },
      Collection: {},
      Communities: {}
    },
    Signer: {
      signer: alicePrivateKey,
    },
  });

  await chain.start();

  chain.registerValue({
    Signer: signer,
  });

  const balances = chain.runtime.resolve("Balances");
  const tx = await chain.transaction(alice, async () => {
    balances.addBalance(TokenId.from(0), alice, Balance.from(1000));
  });

  await tx.sign();
  await tx.send();

  console.log("tx sent");
}

describe("run proxy", () => {
  it("should run proxy", async () => {
    await start();
  });
});
