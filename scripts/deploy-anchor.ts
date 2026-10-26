import { network } from "hardhat";

const connection = await network.create({
  network: "didlab",
});

const { viem } = connection;

console.log("Deploying AnchorRegistry to DIDLab...");

const [deployer] = await viem.getWalletClients();

console.log("Deployer:", deployer.account.address);

const registry = await viem.deployContract("AnchorRegistry");

console.log("AnchorRegistry deployed at:", registry.address);

const adminRole = await registry.read.ADMIN();

const hasAdmin = await registry.read.hasRole([
  adminRole,
  deployer.account.address,
]);

console.log("Deployer has ADMIN role:", hasAdmin);
