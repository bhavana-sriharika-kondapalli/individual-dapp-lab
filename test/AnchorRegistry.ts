
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { keccak256, stringToHex, zeroHash } from "viem";

type AnchorRecord = {
  digest: `0x${string}`;
  cid: string;
  submitter: `0x${string}`;
  submittedAt: bigint;
  verifier: `0x${string}`;
  verifiedAt: bigint;
  verified: boolean;
};
const { viem } = await network.connect();

const ADMIN = keccak256(stringToHex("ADMIN"));
const SUBMITTER = keccak256(stringToHex("SUBMITTER"));
const VERIFIER = keccak256(stringToHex("VERIFIER"));

const recordId = keccak256(stringToHex("BEEF-001-INSPECTION"));
const digest =
  "0x6136e792f2e5387b20f9a76542c95b635a32dbed894aafc33312f1ef944597c8";

const cid = "QmVmTdzCQKBCk9STmwB8akh6LZDRJQPPhGoe6kK8GBAZSB";

async function setup() {
  const [admin, submitter, verifier, outsider] =
    await viem.getWalletClients();

  const registry = await viem.deployContract("AnchorRegistry");

  return { admin, submitter, verifier, outsider, registry };
}

describe("AnchorRegistry — Lab 2 Activity 6", () => {
  it("1. Deployer receives ADMIN role", async () => {
    const { admin, registry } = await setup();

    assert.equal(
      await registry.read.hasRole([ADMIN, admin.account.address]),
      true
    );
  });

  it("2. ADMIN can grant SUBMITTER role", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    assert.equal(
      await registry.read.hasRole([
        SUBMITTER,
        submitter.account.address,
      ]),
      true
    );
  });

  it("3. ADMIN can grant VERIFIER role", async () => {
    const { verifier, registry } = await setup();

    await registry.write.grantRole([
      VERIFIER,
      verifier.account.address,
    ]);

    assert.equal(
      await registry.read.hasRole([
        VERIFIER,
        verifier.account.address,
      ]),
      true
    );
  });

  it("4. Unauthorized wallet cannot grant roles", async () => {
    const { outsider, submitter, registry } = await setup();

    await assert.rejects(
      registry.write.grantRole(
        [SUBMITTER, submitter.account.address],
        { account: outsider.account }
      )
    );
  });

  it("5. Authorized SUBMITTER can anchor a record", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await registry.write.anchor(
      [recordId, digest, cid],
      { account: submitter.account }
    );

    const record = (await registry.read.get([recordId])) as AnchorRecord;

    assert.equal(record.digest, digest);
    assert.equal(record.cid, cid);
    assert.equal(
  record.submitter.toLowerCase(),
  submitter.account.address.toLowerCase()
);
    assert.ok(record.submittedAt > 0n);
  });

  it("6. Duplicate anchoring is rejected", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await registry.write.anchor(
      [recordId, digest, cid],
      { account: submitter.account }
    );

    await assert.rejects(
      registry.write.anchor(
        [recordId, digest, cid],
        { account: submitter.account }
      )
    );
  });

  it("7. Empty digest is rejected", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await assert.rejects(
      registry.write.anchor(
        [recordId, zeroHash, cid],
        { account: submitter.account }
      )
    );
  });

  it("8. Unauthorized anchoring is rejected", async () => {
    const { outsider, registry } = await setup();

    await assert.rejects(
      registry.write.anchor(
        [recordId, digest, cid],
        { account: outsider.account }
      )
    );
  });

  it("9. Submitter cannot verify their own record", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await registry.write.grantRole([
      VERIFIER,
      submitter.account.address,
    ]);

    await registry.write.anchor(
      [recordId, digest, cid],
      { account: submitter.account }
    );

    await assert.rejects(
      registry.write.verify(
        [recordId],
        { account: submitter.account }
      )
    );
  });

  it("10. Independent verifier succeeds; repeat verification fails", async () => {
    const { submitter, verifier, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await registry.write.grantRole([
      VERIFIER,
      verifier.account.address,
    ]);

    await registry.write.anchor(
      [recordId, digest, cid],
      { account: submitter.account }
    );

    await registry.write.verify(
      [recordId],
      { account: verifier.account }
    );

    const record = (await registry.read.get([recordId])) as AnchorRecord;

    assert.equal(
  record.verifier.toLowerCase(),
  verifier.account.address.toLowerCase()
);
    assert.ok(record.verifiedAt > 0n);

    await assert.rejects(
      registry.write.verify(
        [recordId],
        { account: verifier.account }
      )
    );
  });
});
