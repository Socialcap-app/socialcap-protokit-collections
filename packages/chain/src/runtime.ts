import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { Collection, Communities, Persons, Members } from "./collections";
import { Plans, Claims, Tasks } from "./collections";

import { ModulesConfig } from "@proto-kit/common";

export const modules = {
  Collection,
  Balances,
  Communities,
  Persons,
  Members,
  Plans,
  Claims,
  Tasks
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Collection: {},
  Communities: {},
  Persons: {},
  Members: {},
  Plans: {},
  Claims: {},
  Tasks: {}
};

export default {
  modules,
  config,
};
