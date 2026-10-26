import { network } from "hardhat";
import { keccak256, stringToHex } from "viem";

const { viem } = await network.create({
  network: "didlab",
});

const registry = await viem.getContractAt(
  "AnchorRegistry",
  "0xce25f3fb25076c5f667813e6979c1a866bd39e0f"
);

const recordId = keccak256(stringToHex("BEEF-001"));

const record = await registry.read.get([recordId]);

console.log("BEEF-001 stored record:");
console.log(record);