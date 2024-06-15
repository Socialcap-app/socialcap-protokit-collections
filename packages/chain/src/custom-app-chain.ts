import "reflect-metadata";
import { log } from "@proto-kit/common";
import { InMemoryStateService, Runtime, RuntimeModulesRecord } from "@proto-kit/module";
import { MandatoryProtocolModulesRecord, Protocol, ProtocolModulesRecord, StateServiceProvider } from "@proto-kit/protocol";
import { VanillaProtocolModules, VanillaRuntimeModules,} from "@proto-kit/library";
import { Sequencer, SequencerModulesRecord } from "@proto-kit/sequencer";
import { container } from "tsyringe";
import { PrivateKey } from "o1js";
import { GraphqlClient } from "@proto-kit/sdk";
import { GraphqlQueryTransportModule } from "@proto-kit/sdk";
import { GraphqlNetworkStateTransportModule } from "@proto-kit/sdk";
import { GraphqlTransactionSender } from "@proto-kit/sdk";
import { InMemorySigner } from "@proto-kit/sdk";
import { AppChain, AppChainModulesRecord } from "@proto-kit/sdk";

export {
  CustomAppChain,
  type ComputedBlockJSON,
  type ComputedTransactionJSON,
  type ChainState
}


/**
 * Chain state, block and transaction types
 */
interface ComputedTransactionJSON {
  argsFields: string[];
  argsJSON: string[];
  methodId: string;
  nonce: string;
  sender: string;
  signature: {
    r: string;
    s: string;
  };
}

interface ComputedBlockJSON {
  txs?: {
    status: boolean;
    statusMessage?: string;
    tx: ComputedTransactionJSON;
  }[];
}

interface ChainState {
  loading: boolean;
  block?: {
    height: string;
    computed: ComputedBlockJSON;
  } 
}


/**
 * The custom appChain configured to use InMemorySigner and enabled 
 * to access a remote sequencer (by it's Graphql endpoint) 
 */
class CustomAppChain<
  RuntimeModules extends RuntimeModulesRecord,
  ProtocolModules extends ProtocolModulesRecord &
    MandatoryProtocolModulesRecord,
  SequencerModules extends SequencerModulesRecord,
  AppChainModules extends AppChainModulesRecord,
> extends AppChain<
  RuntimeModules,
  ProtocolModules,
  SequencerModules,
  AppChainModules
> {
  public static fromRuntime<RuntimeModules extends RuntimeModulesRecord>(
    runtimeModules: RuntimeModules
  ) {
    const appChain = new CustomAppChain({
      Runtime: Runtime.from({
        modules: VanillaRuntimeModules.with(runtimeModules),
      }),
      Protocol: Protocol.from({
        modules: VanillaProtocolModules.with({}),
      }),
      Sequencer: Sequencer.from({
        modules: {},
      }),

      modules: {
        GraphqlClient,
        Signer: InMemorySigner,
        TransactionSender: GraphqlTransactionSender,
        QueryTransportModule: GraphqlQueryTransportModule,
        NetworkStateTransportModule: GraphqlNetworkStateTransportModule,
      },
    });

    appChain.configurePartial({
      Sequencer: {},
      Protocol: {
        BlockProver: {},
        StateTransitionProver: {},
        AccountState: {},
        BlockHeight: {},
        LastStateRoot: {},
        TransactionFee: {
          tokenId: 0n,
          feeRecipient: PrivateKey.random().toPublicKey().toBase58(),
          baseFee: 0n,
          perWeightUnitFee: 1n,
          methods: {
            "Faucet.drip": {
              baseFee: 0n,
              weight: 0n,
              perWeightUnitFee: 0n,
            },
          },
        },
      },

      Signer: { 
        // we need to setup an initial random private key here that needs
        // to be replaced later (when reconfiguring the appChain) by the 
        // real signer private key
        signer: PrivateKey.random() 
      },
      TransactionSender: {},
      QueryTransportModule: {},
      NetworkStateTransportModule: {},
      GraphqlClient: {
        // we need to setup an initial localhost url here that needs
        // to be replaced later (when reconfiguring the appChain) by the 
        // real url to the remote sequencer
        url: "http://127.0.0.1:8080/graphql",
      },
    });

    /**
     * Register state service provider globally,
     * to avoid providing an entire sequencer.
     *
     * Alternatively we could register the state service provider
     * in runtime's container, but i think the event emitter proxy
     * instantiates runtime/runtime modules before we can register
     * the mock state service provider.
     */
    const stateServiceProvider = new StateServiceProvider();
    stateServiceProvider.setCurrentStateService(new InMemoryStateService());
    container.registerInstance("StateServiceProvider", stateServiceProvider);

    return appChain;
  }

  public async start() {
    log.setLevel("ERROR");
    await super.start();
  }

  /**
   * Setup the private key that will be used to sign transactions.
   * We need to setup the signer here because txn.sign() does 
   * not accepted any args. Would be good if this can be fixed, and work
   * similar to how the o1js txm.sign() works.
   * @param signer: PrivateKey  
   */
  public setSigner(signer: PrivateKey) {
    const inMemorySigner = this.resolveOrFail("Signer", InMemorySigner);
    inMemorySigner.config.signer = signer;
  }

  /**
   * Wait for a block to be produced and includes transactions.
   * The produced block: 
   * @returns the produced block
   */
  public async waitForBlock(): Promise<ChainState> {
    let state: ChainState = {
      loading: true,
      block: undefined
    }
    
    while (!(state.block && state.block.computed.txs?.length)) {
      console.log("Polling block state"); 
      await delay(2); // 2 seconds

      const gqlEndpoint = (this.config.GraphqlClient as any).url;
      const response = await fetch(gqlEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gqlGetBlockQuery),
      });

      const { data } = (await response.json()) as BlockQueryResponse;

      state = chainState(data); 
    }

    return state;
  }
}


/** 
 * Block state Helpers
 */
const chainState = (data: any) => {
  return {
    loading: false,
    block: data.network.unproven
      ? {
          height: data.network.unproven.block.height,
          computed: data.block,
        }
      : undefined
  } 
};

const gqlGetBlockQuery = {
  query: `
    query GetBlock {
      block {
        txs {
          tx {
            argsFields
            argsJSON
            methodId
            nonce
            sender
            signature {
              r
              s
            }
          }
          status
          statusMessage
        }
      }
      network {
        unproven {
          block {
            height
          }
        }
      }
    }
  `,
}

interface BlockQueryResponse {
  data: {
    network: {
      unproven?: {
        block: {
          height: string;
        };
      };
    };
    block: ComputedBlockJSON;
  };
}

function delay(secs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, secs*1000));
}
