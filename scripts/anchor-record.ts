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

const digest =
  "0x6136e792f2e5387b20f9a76542c95b635a32dbed894aafc33312f1ef944597c8";

const cid = "QmVmTdzCQKBCk9STmwB8akh6LZDRJQPPhGoe6kK8GBAZSB";

console.log("Anchoring BEEF-001...");

const txHash = await registry.write.anchor([
  recordId,
  digest,
  cid,
]);

console.log("Transaction hash:", txHash);

const publicClient = await viem.getPublicClient();
const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
});

console.log("Transaction status:", receipt.status);
console.log("Block number:", receipt.blockNumber.toString());