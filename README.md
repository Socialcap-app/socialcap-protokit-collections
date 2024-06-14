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

- Collections: Communities, Persons, Members, Plans, Claims, Tasks, Credentials
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

An Entity is basically a JS object which can be serialized and deserialized using JSON, but with some additional restrictions:

- It can be fully stored as a row in Relational DB, so it should be possible for any of its properties to be converted to some DB datatypes.
- It MUST have a unique UID (UUID), so it can be accessed using its unique UID.
- It will be an instance of some EntityClass, and this class can be mapped to some table in a Relational DB. 

An EntityClass should provide some basic method for its instances: 

- toJSON(entity): creates a serialized version of the entity
- fromJSON(entity): parses a serialized version and returns the entity
- hash(entity): creates a content hash using the entity properties

**Collections**:

A Collection of a given EntityClass is an unordered set of instances of such EntityClass.

Each collection will have an ssociated MerkleMap where:

- It will have one (and only one) leaf per entity
- The Merkle Leaf key will be the UID of the given entity
- The Merke Leaf value will be the hash(entity)

Collections allow the following operations:

- Get a given instance of the collections using its UID.
- Get a filtered and ordered set of the collection using some query language (SQL)
- Prove that a given instance has not been "tampered" (modified in the DB by unknow methods).
- Use its Merkle root and witness to prove some entity effectively belongs to the given collection.

## Architecture

The UI will continue to use the current API to manage the different collections in the IndexerDb, but every time we insert/update/remove a collection we will create a Protokit transaction.

We can not store the full item content in Protokit (because non-o1js
types are not supported), so we just store a hash of the item full content,
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
