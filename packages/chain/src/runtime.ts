import { Balance } from "@proto-kit/library";
import { Balances } from "./balances";
import { Collection, Communities } from "./collections";
import { ModulesConfig } from "@proto-kit/common";

export const modules = {
  Balances,
  Collection,
  Communities
};

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  Collection: {},
  Communities: {}
};

export default {
  modules,
  config,
};
