/**
 * A General Collection runtimeModule for Provable collections.
 * 
 * The collections we want to manage are:
 * 
 *  - Communities
 *  - Persons
 *  - Members
 *  - Plans
 *  - Claims 
 *  - Tasks
 * 
 * Because we can not store the full item content in Protokit (because non-o1js
 * types are not supported), we just store a hash of the item full content,
 * and its size.
 * 
 * FUTURE WORK: It may be better to have a particular runtimeModule
 * for each collection type. But for now this can be a good starting point 
 * in how to use Protokit with Socialcap.
 */
import {
  RuntimeModule,
  runtimeMethod,
  state,
  runtimeModule,
} from "@proto-kit/module";
import { StateMap, assert } from "@proto-kit/protocol";
import { Bool, Field, Poseidon, PublicKey, Struct } from "o1js";
import { UInt64, UInt32 } from "@proto-kit/library"
// import { inject } from "tsyringe";

export class UID extends Field {};

export class CollectionItem extends Struct({
  uid: UID,
  contentHash: Field,
  contentSize: UInt32,
  createdAt: UInt64,
  updatedAt: UInt64,
  updaterUid: UID,
  owner: PublicKey // do we really have an owner for each item ?
}) {}

@runtimeModule()
export class Collection extends RuntimeModule<Record<string, never>> {
  @state() public items = StateMap.from<UID, CollectionItem>(
    UID,
    CollectionItem
  );

  @runtimeMethod()
  public getItem(uid: UID): CollectionItem {
    const storedItem = this.items.get(uid);
    assert(storedItem.isSome, "CollectionItem does not exist");
    return storedItem.value;
  }  

  @runtimeMethod()
  public addItem(
    uid: UID,
    hash: Field,
    size: UInt32,
    updater: UID,
  ) {
    const storedItem = this.items.get(uid);
    assert(storedItem.isSome.not(), "CollectionItem already exists");

    const item = new CollectionItem({
      uid: uid,
      contentHash: hash,
      contentSize: size,
      updaterUid: updater,
      createdAt: UInt64.from(this.network.block.height),
      updatedAt: UInt64.from(this.network.block.height),
      owner: this.transaction.sender.value,
    });

    this.items.set(item.uid, item);
  }

/*   
  @runtimeMethod()
  public updateItem(params: {
    uid: UID;
    hash: Field;
    size: UInt32;
    updater: UID;
  }) {
    const storedItem = this.items.get(params.uid);
    assert(storedItem.isSome, "CollectionItem does not exist");

    const item = new CollectionItem({
      uid: params.uid,
      contentHash: params.hash,
      contentSize: params.size,
      updaterUid: params.updater,
      createdAt: storedItem.value.createdAt,
      updatedAt: UInt64.from(this.network.block.height),
      owner: this.transaction.sender.value,
    });

    this.items.set(item.uid, item);
  }
 */
}

@runtimeModule()
export class Communities extends Collection {};
