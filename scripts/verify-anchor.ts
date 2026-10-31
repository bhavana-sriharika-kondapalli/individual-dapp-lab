import { network } from "hardhat";
import { keccak256, stringToHex } from "viem";

type AnchorRecord = {
  digest: `0x${string}`;
  cid: string;
  submitter: `0x${string}`;
  submittedAt: bigint;
  verifier: `0x${string}`;
  verifiedAt: bigint;
  verified: boolean;
};
const { viem } = await network.create({
  network: "didlabVerifier",
});

const [verifier] = await viem.getWalletClients();

const registry = await viem.getContractAt(
  "AnchorRegistry",
  "0xa0fffd4c2774b3497132059e1e4cf38594d7f289"
);

const recordId = keccak256(stringToHex("BEEF-SECURITY-TEST-001"));

console.log("Verifier wallet:", verifier.account.address);

const before = (await registry.read.get([recordId])) as AnchorRecord;

console.log("Current verifier:", before.verifier);

if (
  before.verifier.toLowerCase() !==
  "0x0000000000000000000000000000000000000000"
) {
  throw new Error("Record is already verified. No new transaction sent.");
}

const expectedVerifier =
  "0xea30a5069e3b0509cb628258624c8e878aeafb8a";

if (verifier.account.address.toLowerCase() !== expectedVerifier) {
  throw new Error("Wrong verifier wallet. No transaction sent.");
}

console.log("Verifying BEEF-SECURITY-TEST-001...");

const txHash = await registry.write.verify([recordId]);

console.log("Verification transaction hash:", txHash);

const publicClient = await viem.getPublicClient();

const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
});

console.log("Transaction status:", receipt.status);
console.log("Block number:", receipt.blockNumber.toString());

const after = (await registry.read.get([recordId])) as AnchorRecord;

console.log("Verified by:", after.verifier);
console.log("Verified at:", after.verifiedAt.toString());