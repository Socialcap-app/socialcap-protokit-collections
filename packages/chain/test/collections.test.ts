import { PrivateKey, Field, Poseidon } from "o1js";
import { TestingAppChain } from "@proto-kit/sdk";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64, UInt32 } from "@proto-kit/library";
import { Collection, Communities } from "../src/collections";

log.setLevel("ERROR");

describe("collections", () => {
  it("should demonstrate how Collection works", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Collection,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        Collection: {}
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alice = alicePrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const collection = appChain.runtime.resolve("Collection");

    const itemUid = Field('99990001'); 
    const tx1 = await appChain.transaction(
      alice, 
      () => {
        collection.addItem(
          itemUid,
          Poseidon.hash([Field(0), Field(1), Field(2), Field(4)]),
          UInt32.from(120),
          Field('88880001')
        );
      }
    );

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    const storedItem = await appChain.query.runtime.Collection.items.get(itemUid);

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(storedItem?.uid.toString()).toBe(itemUid.toString());
  }, 1_000_000);
});
