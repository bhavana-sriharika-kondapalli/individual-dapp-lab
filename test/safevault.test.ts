
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther, zeroAddress } from "viem";

const { viem } = await network.connect();

describe("Guided Lab 3 - SafeVault security tests", () => {
  it("blocks unauthorized ownership changes", async () => {
    const [owner, attacker] = await viem.getWalletClients();
    const vault = await viem.deployContract("SafeVault");

    await assert.rejects(
      vault.write.setOwner([attacker.account.address], {
        account: attacker.account,
      }),
      /NotOwner/
    );

    assert.equal(
      (await vault.read.owner()).toLowerCase(),
      owner.account.address.toLowerCase()
    );
  });

  it("rejects zero address as owner", async () => {
    const [owner] = await viem.getWalletClients();
    const vault = await viem.deployContract("SafeVault");

    await assert.rejects(
      vault.write.setOwner([zeroAddress], {
        account: owner.account,
      }),
      /ZeroAddress/
    );
  });

  it("blocks a reentrancy attack", async () => {
    const [owner, victim, attacker] =
      await viem.getWalletClients();

    const vault = await viem.deployContract("SafeVault");

    await vault.write.deposit([], {
      account: victim.account,
      value: parseEther("5"),
    });

    const reenterer = await viem.deployContract("Reenterer", [
      vault.address,
    ]);

    await assert.rejects(
      reenterer.write.attack([], {
        account: attacker.account,
        value: parseEther("1"),
      })
    );

    const publicClient = await viem.getPublicClient();

    const remaining = await publicClient.getBalance({
      address: vault.address,
    });

    assert.equal(remaining, parseEther("5"));
  });

  it("allows legitimate deposits and withdrawals", async () => {
    const [, user] = await viem.getWalletClients();
    const vault = await viem.deployContract("SafeVault");

    await vault.write.deposit([], {
      account: user.account,
      value: parseEther("2"),
    });

    assert.equal(
      await vault.read.balances([user.account.address]),
      parseEther("2")
    );

    await vault.write.withdraw([parseEther("1")], {
      account: user.account,
    });

    assert.equal(
      await vault.read.balances([user.account.address]),
      parseEther("1")
    );
  });
});
