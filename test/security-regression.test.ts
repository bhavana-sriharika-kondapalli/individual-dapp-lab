
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

const recordId = keccak256(stringToHex("GL3-REGRESSION"));
const digest = keccak256(stringToHex("inspection-document"));
const cid = "QmVmTdzCQKBCk9STmwB8akh6LZDRJQPPhGoe6kK8GBAZSB";

async function setup() {
  const [admin, submitter] = await viem.getWalletClients();
  const registry = await viem.deployContract("AnchorRegistry");
  return { admin, submitter, registry };
}

describe("Guided Lab 3 - Security regression tests", () => {

  it("1. Prevents removal of the last ADMIN", async () => {
    const { admin, registry } = await setup();

    await assert.rejects(
      registry.write.revokeRole([
        ADMIN,
        admin.account.address,
      ]),
      /LastAdmin/
    );

    assert.equal(await registry.read.adminCount(), 1n);
  });

  it("2. Rejects zero-address role grants", async () => {
    const { registry } = await setup();

    await assert.rejects(
      registry.write.grantRole([
        SUBMITTER,
        zeroAddress,
      ]),
      /ZeroAddress/
    );
  });

  it("3. Rejects unsupported roles", async () => {
    const { submitter, registry } = await setup();

    const UNKNOWN_ROLE = keccak256(stringToHex("UNKNOWN_ROLE"));

    await assert.rejects(
      registry.write.grantRole([
        UNKNOWN_ROLE,
        submitter.account.address,
      ]),
      /InvalidRole/
    );
  });

  it("4. Rejects empty IPFS CIDs", async () => {
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

  it("5. Rejects zero record IDs", async () => {
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

  it("6. Supports safe ADMIN handover", async () => {
    const { admin, submitter, registry } = await setup();

    await registry.write.grantRole([
      ADMIN,
      submitter.account.address,
    ]);

    assert.equal(await registry.read.adminCount(), 2n);

    await registry.write.revokeRole([
      ADMIN,
      admin.account.address,
    ]);

    assert.equal(await registry.read.adminCount(), 1n);

    assert.equal(
      await registry.read.hasRole([
        ADMIN,
        submitter.account.address,
      ]),
      true
    );
  });

  it("7. Valid record anchoring still works", async () => {
    const { submitter, registry } = await setup();

    await registry.write.grantRole([
      SUBMITTER,
      submitter.account.address,
    ]);

    await registry.write.anchor(
      [recordId, digest, cid],
      { account: submitter.account }
    );

    const record = await registry.read.get([recordId]);

    assert.equal(record.digest, digest);
    assert.equal(record.cid, cid);
  });
});
