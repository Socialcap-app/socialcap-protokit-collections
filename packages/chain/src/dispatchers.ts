import { PrivateKey, PublicKey, Field, Undefined } from "o1js";
import { Balance, Balances, UInt32, UInt64 } from "@proto-kit/library";
import { CustomAppChain } from "./custom-app-chain";
import { CollectionNotification } from "./types/notification";
import { Collection, Communities } from "./collections";
import { Persons, Members, Plans, Claims, Tasks } from "./collections";
import { notInCircuit } from "@proto-kit/protocol";


export class AppChainCollectionsDispatcher {
  chain: any;
  collection: string = "";

  constructor(name: string) {
    this.chain = null;
    this.collection = name;
  }

  async startAppChain() {
    if (this.chain) return this.chain;

    // configure the custom AppChain 
    const appChain = CustomAppChain.fromRuntime({
      Balances,
      Collection,
      Communities,
      Persons,
      Members,
      Claims,
      Plans,
      Tasks
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
          },
        Collection: {},
        Communities: {},
        Persons: {},
        Members: {},
        Plans: {},
        Claims: {},
        Tasks: {}
      },
      // CAUTION: we need to setup the sequencer URL here if the sequencer 
      // is running in some remote host and not in localhost
      GraphqlClient: {
        url: "http://127.0.0.1:8080/graphql",
      },
    });

    await appChain.start();
    return appChain;
  }    

  async dispatchTransaction(
    signerKey: PrivateKey, 
    notified: CollectionNotification,
  ) {
    if (notified.action === 'update')
      return await this.updateItem(signerKey, notified);
    if (notified.action === 'add')
      return await this.addItem(signerKey, notified);
    throw Error(`Invalid action ${notified.action} in dispatchTransaction`)
  }  
  
  async addItem(
    signerKey: PrivateKey, 
    notified: CollectionNotification,
  ) {
    this.chain = await this.startAppChain();
    const collection = this.chain.runtime.resolve(this.collection);
    this.chain.setSigner(signerKey);
    const tx1 = await this.chain.transaction(
      signerKey.toPublicKey(), 
      () => { 
          collection.addItem(
            Field(notified.uid),
            Field(notified.contentHash),
            UInt32.from(notified.contentSize),
            Field(notified.updatedBy)
          ); 
      }
    );
    await tx1.sign();
    await tx1.send();
    return tx1;
  }

  async updateItem(
    signerKey: PrivateKey, 
    notified: CollectionNotification,
  ) {
    this.chain = await this.startAppChain();    
    const collection = this.chain.runtime.resolve(this.collection);
    this.chain.setSigner(signerKey);
    const tx1 = await this.chain.transaction(
      signerKey.toPublicKey(), 
      () => { 
          collection.updateItem(
            Field(notified.uid),
            Field(notified.contentHash),
            UInt32.from(notified.contentSize),
            Field(notified.updatedBy)
          ); 
      }
    );
    await tx1.sign();
    await tx1.send();
    return tx1;
  }    
}
