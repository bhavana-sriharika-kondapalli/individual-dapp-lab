import { network } from "hardhat";

const { viem } = await network.create({
  network: "didlab",
});

const registry = await viem.getContractAt(
  "AnchorRegistry",
  "0xce25f3fb25076c5f667813e6979c1a866bd39e0f"
);

const submitter = "0xb323821f0dfcf3b2e8727a7fbae2e34f0d4f393f";
const verifier = "0xea30A5069e3b0509cB628258624c8E878aeAFB8a";

const submitterRole = await registry.read.SUBMITTER();
const verifierRole = await registry.read.VERIFIER();

console.log(
  "SUBMITTER role:",
  await registry.read.hasRole([submitterRole, submitter])
);

console.log(
  "VERIFIER role:",
  await registry.read.hasRole([verifierRole, verifier])
);