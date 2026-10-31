
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { keccak256, stringToHex, zeroHash } from "viem";

const { viem } = await network.connect();

const ADMIN = keccak256(stringToHex("ADMIN"));
const SUBMITTER = keccak256(stringToHex("SUBMITTER"));
const VERIFIER = keccak256(stringToHex("VERIFIER"));

const recordId = keccak256(stringToHex("GL3-SECURITY-TEST"));
const digest = keccak256(stringToHex("inspection-document"));
const cid = "QmVmTdzCQKBCk9STmwB8akh6LZDRJQPPhGoe6kK8GBAZSB";

async function setup() {
  const [admin, submitter, verifier, outsider] =
    await viem.getWalletClients();

  const registry = await viem.deployContract("AnchorRegistry");

  return { admin, submitter, verifier, outsider, registry };
}

describe("Guided Lab 3 - AnchorRegistry adversarial tests", () => {

  it("1. Outsider cannot revoke roles", async () => {
    const { submitter, outsider, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await assert.rejects(
      registry.write.revokeRole(
        [SUBMITTER, submitter.account.address],
        { account: outsider.account }
      )
    );

    assert.equal(
      await registry.read.hasRole([
        SUBMITTER,
        submitter.account.address,
      ]),
      true
    );
  });

  it("2. Revoked submitter cannot anchor", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await registry.write.revokeRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await assert.rejects(
      registry.write.anchor(
        [recordId, digest, cid],
        { account: submitter.account }
      )
    );
  });

  it("3. Unknown record cannot be verified", async () => {
    const { verifier, registry } = await setup();

    await registry.write.grantRole([
      VERIFIER,
      verifier.account.address,
    ]);

    await assert.rejects(
      registry.write.verify(
        [recordId],
        { account: verifier.account }
      )
    );
  });

  it("4. Empty CID is rejected", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await assert.rejects(
      registry.write.anchor(
        [recordId, digest, ""],
        { account: submitter.account }
      ),
      /EmptyCid/
    );
  });

  it("5. Zero record ID is rejected", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await assert.rejects(
      registry.write.anchor(
        [zeroHash, digest, cid],
        { account: submitter.account }
      ),
      /EmptyRecordId/
    );
  });

  it("6. Last ADMIN cannot revoke their own role", async () => {
    const { admin, registry } = await setup();

    await assert.rejects(
      registry.write.revokeRole([
        ADMIN,
        admin.account.address,
      ]),
      /LastAdmin/
    );

    assert.equal(
      await registry.read.hasRole([
        ADMIN,
        admin.account.address,
      ]),
      true
    );

    assert.equal(await registry.read.adminCount(), 1n);
  });
});
