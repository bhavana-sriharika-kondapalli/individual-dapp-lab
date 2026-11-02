import { network } from "hardhat";
import { keccak256, stringToHex } from "viem";

const { viem } = await network.create({ network: "didlab" });

const registry = await viem.getContractAt(
  "AnchorRegistry",
  "0xa0fffd4c2774b3497132059e1e4cf38594d7f289"
);

const recordId = keccak256(stringToHex("BEEF-SECURITY-TEST-001"));
const record = await registry.read.get([recordId]);

console.log("Record ID:", recordId);
console.log("Stored record:", record);
