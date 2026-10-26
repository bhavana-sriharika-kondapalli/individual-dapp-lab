import { network } from "hardhat";

const { viem } = await network.create({
  network: "didlabVerifier",
});

const [wallet] = await viem.getWalletClients();

console.log("Verifier wallet:", wallet.account.address);