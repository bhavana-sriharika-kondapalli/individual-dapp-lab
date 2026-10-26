
import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

export default defineConfig({
  plugins: [hardhatToolboxViem],

  solidity: {
    version: "0.8.24",
    settings: {
        evmVersion: "paris",
    },
  },

  networks: {
    didlab: {
      type: "http",
      chainType: "generic",
      url: "https://eth.didlab.org",
      chainId: 252501,
      accounts: [configVariable("DIDLAB_PRIVATE_KEY")],
    },
    didlabVerifier: {
        type: "http",
        chainType: "generic",
        url: "https://eth.didlab.org",
        chainId: 252501,
        accounts: [configVariable("DIDLAB_VERIFIER_PRIVATE_KEY")],
    },
  },
});
