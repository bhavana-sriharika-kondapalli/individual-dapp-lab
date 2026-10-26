import { network } from "hardhat";
import { keccak256, stringToHex } from "viem";

const { viem } = await network.create({
  network: "didlab",
});

const publicClient = await viem.getPublicClient();

const registry = await viem.getContractAt(
  "AnchorRegistry",
  "0xce25f3fb25076c5f667813e6979c1a866bd39e0f"
);

const recordId = keccak256(stringToHex("BEEF-001"));

const submitter =
  "0xb323821f0dfcf3b2e8727a7fbae2e34f0d4f393f";

const outsider =
  "0x1111111111111111111111111111111111111111";

async function expectRejection(
  label: string,
  account: `0x${string}`,
  functionName: "anchor" | "verify",
  args: readonly unknown[]
) {
  try {
    await publicClient.simulateContract({
      address: registry.address,
      abi: registry.abi,
      account,
      functionName,
      args: args as any,
    });

    console.log(`FAIL: ${label} unexpectedly succeeded`);
  } catch (error: any) {
    console.log(`PASS: ${label} rejected`);
    console.log("Reason:", error.shortMessage ?? error.message);
  }
}

console.log("Activity 9 — Security Evidence");

await expectRejection(
  "Unauthorized wallet attempts anchoring",
  outsider,
  "anchor",
  [
    keccak256(stringToHex("UNAUTHORIZED-PROBE")),
    `0x${"22".repeat(32)}`,
    "bafyPROBE",
  ]
);

await expectRejection(
  "Unauthorized wallet attempts verification",
  outsider,
  "verify",
  [recordId]
);

await expectRejection(
  "Submitter attempts self-verification",
  submitter,
  "verify",
  [recordId]
);

console.log("Security checks finished.");