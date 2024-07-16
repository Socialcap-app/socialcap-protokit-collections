import { randomInt } from "crypto";
import { PrivateKey, Field, Poseidon } from "o1js";
import { postMessage } from "../src/requests";
import { log } from "@proto-kit/common";
import { UInt64, UInt32 } from "@proto-kit/library";

log.setLevel("ERROR");

describe("Collections", () => {
  it("should publish a message to update a collection", async () => {

    const itemUid = Field(randomInt(10000)); 
    await postMessage({
      scope: 'group',
      action: 'add',
      collection: 'Communities',
      uid: itemUid.toString(),
      contentHash: Poseidon.hash([Field(0), Field(1), Field(2), Field(4)]).toString(),
      contentSize: 10,
      updatedBy: Field(randomInt(10000)).toString()
    })
  });  
});
