# Protokit integration into Socialcap

A general Collection runtimeModule for Provable collections.

The collections we want to manage are:

 - Communities
 - Persons
 - Members
 - Plans
 - Claims 
 - Tasks

## Goals 

We want to advance the following milestones using Protokit features:

**A3. Efficient + Provable collections** 

- Collections: Communities, Persons, Members, Plans, Claims, Tasks
- Analyze alternative implementations         
- Define integration points         
- Refactor current code to support integration           
- Modify current backend to suppor Protokit         
- Testing on devnet

**S9. Tokenizing credentials**         

- Analyze custom token contracts         
- Define token params for community         
- Add UI config option for community         
- Add token ammount per credential to UI         
- Modify current credential issuance to assign tokens           
- Testing on devnet   

## Provable collections

**Entity**

An *Entity* is a fundamental object that represents a single unit of data which can be stored in a database. In this context, an Entity is a JavaScript object that can be serialized and deserialized using JSON, with some additional restrictions:

- It can be fully stored as a row in a Relational Database, meaning all its properties should be convertible to database datatypes.
- It MUST have a unique Uid (UUID) to ensure it can be uniquely identified and accessed.
- It will be an instance of a specific EntityClass, which maps to a table in a Relational Database.

An EntityClass should provide basic methods for its instances:

- `toJSON(entity)`: creates a serialized version of the entity.
- `fromJSON(entity)`: parses a serialized version and returns the entity.
- `hash(entity)`: generates a content hash using the entity’s properties.

**Collections**

A Collection of a given EntityClass is an unordered set of instances of that EntityClass.

Collections allow the following operations:

- Retrieve a specific instance from the collection using its UID.
- Get a filtered and ordered subset of the collection using a query language (e.g., SQL).
- Verify that a given instance has not been tampered with (modified in the database by unknown methods).
- Use Protokit to prove that an entity belongs to the given collection.

**Provable collection**

By _"provable"_ we mean that at some later time we may need to "prove" that the a given entity coming from the  Db has not been altered by any external unauthorized parties without regulated control. By "regulated control" we mean a given API RPC call, which is considered as the only "accepted" way to change a row in the Db.

To whom are we proving it? We are talking in particular about external auditors (such as ISO 9000/14000 or FDA CFR21 Part 11 auditors), conducting an external audit on the data.

How we can prove it ? Because we store the hash for every record on the Protokit appChain, the data can be stored anywhere (ideally replicated). And as long as we can fetch the data and hash it, we can compare it with what is stored on the appChain and show it has not been "altered" in any way.

## Architecture

The UI will continue to use the current API to manage the different collections in the IndexerDb, but every time we insert/update/remove a collection we will create a Protokit transaction. Here is how we do it:

1. We insert or update a  row in our IndexerDb using the API (standard RPC call) , for example a new person/profile, a new community, etc. Each row/entity has its unique Uid (strictly an UUID) in the full Db.
2. After doing this, we hash the full content of the inserted/updated row and get the `contentHash` and the `contentSize` of this row. We will use the `hash(entity)` method provided by the EntityClass.
3. We then send a transaction to Protokit for the given collection (for example Communities) and so we have the row `contentHash` and `contentsSize` stored in the appChain, refered by its `uid`. 
4. When the transaction has been completed, we detect it (using the indexer) and add the completed transaction id to the row, to assert that the given row has been finally stored in the appChain.

**Note**: We can not store the full item content in Protokit (because non-o1js
types are not supported), so we need to just store a hash of the item full content,
and its size. The item content `hash` and `size` must be computed outside the runtimeMethod called when sending the Protokit transaction.

FUTURE WORK: It may be better to have a particular runtimeModule
for each collection type. But for now this can be a good starting point 
in how to use Protokit with Socialcap.

The diagram below shows the described data flow:

![Architecture](/home/mzito/dev/socialcap/collections/docs/Architecture.png)



The following example shows how the different data and entities are cross related:

![Example](/home/mzito/dev/socialcap/collections/docs/Example.png)



## The Protokit starter-kit

Starter-kit repo: https://github.com/proto-kit/starter-kit

This repository is a monorepo aimed at kickstarting application chain development using the Protokit framework.

### Quick start

The monorepo contains 1 package and 1 app:

- `packages/chain` contains everything related to your app-chain
- `apps/web` contains a demo UI that connects to your locally hosted app-chain sequencer

**Prerequisites:**

- Node.js v18
- pnpm
- nvm

> If you're on windows, please use Docker until we find a more suitable solution to running the `@proto-kit/cli`. 
> Run the following command and then proceed to "Running the sequencer & UI":
>
> `docker run -it --rm -p 3000:3000 -p 8080:8080 -v %cd%:/starter-kit -w /starter-kit gplane/pnpm:node18 bash`


### Setup

```zsh
git clone https://github.com/proto-kit/starter-kit my-chain
cd my-chain

# ensures you have the right node.js version
nvm use
pnpm install
```

### Running the sequencer & UI

```zsh
# starts both UI and sequencer locally
pnpm dev

# starts UI only
pnpm dev -- --filter web
# starts sequencer only
pnpm dev -- --filter chain
```

### Running tests
```zsh
# run and watch tests for the `chain` package
pnpm run test --filter=chain -- --watchAll
```

Navigate to `localhost:3000` to see the example UI, or to `localhost:8080/graphql` to see the GQL interface of the locally running sequencer.
