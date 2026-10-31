
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import {
  keccak256,
  stringToHex,
  zeroAddress,
  zeroHash,
} from "viem";

const { viem } = await network.connect();

const ADMIN = keccak256(stringToHex("ADMIN"));
const SUBMITTER = keccak256(stringToHex("SUBMITTER"));

const recordId = keccak256(
  stringToHex("GL3-AI-AUDIT-VERIFICATION")
);

const digest = keccak256(
  stringToHex("inspection-document")
);

async function setup() {
  const [admin, submitter] = await viem.getWalletClients();
  const registry = await viem.deployContract("AnchorRegistry");

  return { admin, submitter, registry };
}

describe("Guided Lab 3 - Activity 9 AI findings regression verification", () => {

  it("AC-01: last administrator cannot remove own role", async () => {
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
  });

  it("AC-02: unsupported role identifiers are rejected", async () => {
    const { submitter, registry } = await setup();

    const UNKNOWN_ROLE = keccak256(
      stringToHex("UNKNOWN_ROLE")
    );

    await assert.rejects(
      registry.write.grantRole([
        UNKNOWN_ROLE,
        submitter.account.address,
      ]),
      /InvalidRole/
    );

    assert.equal(
      await registry.read.hasRole([
        UNKNOWN_ROLE,
        submitter.account.address,
      ]),
      false
    );
  });

  it("AC-03: zero-address role assignment is rejected", async () => {
    const { registry } = await setup();

    await assert.rejects(
      registry.write.grantRole([
        SUBMITTER,
        zeroAddress,
      ]),
      /ZeroAddress/
    );

    assert.equal(
      await registry.read.hasRole([
        SUBMITTER,
        zeroAddress,
      ]),
      false
    );
  });

  it("IV-01: empty CID is rejected", async () => {
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

  it("IV-02: zero record ID is rejected", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await assert.rejects(
      registry.write.anchor(
        [zeroHash, digest, "QmValidExample"],
        { account: submitter.account }
      ),
      /EmptyRecordId/
    );
  });

  it("IV-03: arbitrary CID format remains accepted", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await registry.write.anchor(
      [recordId, digest, "not-an-ipfs-cid"],
      { account: submitter.account }
    );

    const record = await registry.read.get([recordId]);

    assert.equal(record.cid, "not-an-ipfs-cid");
  });
});
