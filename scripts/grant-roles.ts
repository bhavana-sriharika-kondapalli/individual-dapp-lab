import { network } from "hardhat";

const { viem } = await network.create({
  network: "didlab",
});

const [admin] = await viem.getWalletClients();

const registryAddress =
  "0xce25f3fb25076c5f667813e6979c1a866bd39e0f";

const registry = await viem.getContractAt(
  "AnchorRegistry",
  registryAddress
);

const submitter = admin.account.address;
const verifier = "0xea30A5069e3b0509cB628258624c8E878aeAFB8a";

const submitterRole = await registry.read.SUBMITTER();
const verifierRole = await registry.read.VERIFIER();

console.log("Granting SUBMITTER role...");
await registry.write.grantRole([submitterRole, submitter]);

console.log("Granting VERIFIER role...");
await registry.write.grantRole([verifierRole, verifier]);

console.log(
  "SUBMITTER assigned:",
  await registry.read.hasRole([submitterRole, submitter])
);

console.log(
  "VERIFIER assigned:",
  await registry.read.hasRole([verifierRole, verifier])
);
