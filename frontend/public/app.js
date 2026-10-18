import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  stringToHex,
  padHex
} from "https://esm.sh/viem@2";
import { abi } from "./abi.js";

const didlab = defineChain({
  id: 252501,
  name: "DIDLab",
  nativeCurrency: {
    name: "TRUST",
    symbol: "TRUST",
    decimals: 18
  },
  rpcUrls: {
    default: { http: ["https://eth.didlab.org"] }
  },
  blockExplorers: {
    default: {
      name: "DIDLab Explorer",
      url: "https://explorer.didlab.org"
    }
  }
});

const CONTRACT = "0x20bA1c398CD59b05dA4427162bdA7F26d5AB802e";
let activeBatchId = padHex(stringToHex("BEEF-001"), {
  size: 32,
  dir: "right"
});

const publicClient = createPublicClient({
  chain: didlab,
  transport: http()
});

const networkElement = document.getElementById("network");

try {
  const block = await publicClient.getBlockNumber();
  networkElement.textContent = `chain 252501 � block ${block}`;
} catch (error) {
  networkElement.textContent = `Network error: ${error.message}`;
  console.error(error);
}
let walletClient = null;
let account = null;

async function connectWallet() {
  const accountElement = document.getElementById("account");
  const submitButton = document.getElementById("submit");

  if (!window.ethereum) {
    accountElement.textContent =
      "MetaMask not detected. Please install MetaMask.";
    return;
  }

  try {
    walletClient = createWalletClient({
      chain: didlab,
      transport: custom(window.ethereum)
    });

    const addresses = await walletClient.requestAddresses();
    const selectedAccount = addresses[0];

    let chainId = await walletClient.getChainId();

    if (chainId !== didlab.id) {
      accountElement.textContent =
        "Wrong network. Switching to DIDLab...";

      try {
        await walletClient.switchChain({ id: didlab.id });
      } catch (error) {
        if (error.code === 4902) {
          await walletClient.addChain({ chain: didlab });
          await walletClient.switchChain({ id: didlab.id });
        } else {
          throw error;
        }
      }

      chainId = await walletClient.getChainId();
    }

    if (chainId !== didlab.id) {
      throw new Error("Please switch MetaMask to DIDLab.");
    }

    account = selectedAccount;
    accountElement.textContent = `Wallet connected: ${account}`;
    submitButton.disabled = false;

  } catch (error) {
    account = null;
    submitButton.disabled = true;
    accountElement.textContent =
      `Wallet connection failed: ${error.shortMessage ?? error.message}`;
    console.error(error);
  }
}

document.getElementById("connect")
  .addEventListener("click", connectWallet);

window.ethereum?.on?.("chainChanged", () => window.location.reload());
window.ethereum?.on?.("accountsChanged", () => window.location.reload());
async function loadState() {
  const stateElement = document.getElementById("state");

  try {
    const batchId = activeBatchId; 

    const result = await publicClient.readContract({
      address: CONTRACT,
      abi,
      functionName: "getBatch",
      args: [batchId]
    });

    stateElement.textContent = JSON.stringify(
      result,
      (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      2
    );
  } catch (error) {
    stateElement.textContent =
      `Unable to load batch: ${error.shortMessage ?? error.message}`;
    console.error(error);
  }
}

await loadState();
async function simulateRegistration() {
  const stateElement = document.getElementById("simulation");

  if (!account) {
    stateElement.textContent = "Connect MetaMask first.";
    return;
  }

  const newBatchId = padHex(stringToHex("IND-BEEF-001"), {
    size: 32,
    dir: "right"
  });

  try {
    stateElement.textContent = "Simulating transaction...";

    const result = await publicClient.simulateContract({
      address: CONTRACT,
      abi,
      functionName: "registerBatch",
      args: [newBatchId, 250n],
      account
    });

    stateElement.textContent =
      "Simulation successful! Transaction can be submitted.";

    console.log("Simulation result:", result);
  } catch (error) {
    stateElement.textContent =
      "Simulation failed: " + (error.shortMessage ?? error.message);

    console.error("Simulation error:", error);
  }
}

document.getElementById("simulate")
  .addEventListener("click", simulateRegistration);
async function submitRegistration() {
  const statusElement = document.getElementById("transactionStatus");
  const submitButton = document.getElementById("submit");


  if (!walletClient || !account) {
    statusElement.textContent = "Please connect MetaMask first.";
    return;
  }

  const newBatchId = padHex(stringToHex("IND-BEEF-006"), {
    size: 32,
    dir: "right"
  });

  submitButton.disabled = true;

  try {
    statusElement.textContent = "Simulating transaction...";

    const { request } = await publicClient.simulateContract({
      address: CONTRACT,
      abi,
      functionName: "registerBatch",
      args: [newBatchId, 250n],
      account
    });

    statusElement.textContent = "Waiting for MetaMask approval...";

    const hash = await walletClient.writeContract(request);

    statusElement.textContent =
      "Transaction pending: " + hash;

    console.log("Transaction hash:", hash);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash
    });

    if (receipt.status === "success") {
      statusElement.textContent =
        "Transaction confirmed! Hash: " + hash +
        "\nBlock: " + receipt.blockNumber;

      console.log("Transaction receipt:", receipt);
    } else {
      statusElement.textContent =
        "Transaction reverted on-chain. Hash: " + hash;
    }
  } catch (error) {
    statusElement.textContent =
      "Transaction failed: " + (error.shortMessage ?? error.message);

    console.error("FULL REGISTER ERROR:", error);
    console.error("CONTRACT ERROR NAME:", error.cause?.data?.errorName);
    console.error("ERROR DETAILS:", error.details);
  } finally {
    submitButton.disabled = false;
  }
}

document.getElementById("submit")
  .addEventListener("click", submitRegistration);
async function testOnChainRevert() {
  const status = document.getElementById("revertStatus");
  const button = document.getElementById("revertTest");

  if (!walletClient || !account) {
    status.textContent = "Please connect MetaMask first.";
    return;
  }

  button.disabled = true;

  try {
    const existingBatchId = padHex(stringToHex("BEEF-001"), {
      size: 32,
      dir: "right"
    });

    status.textContent = "Waiting for MetaMask approval...";

    // Deliberately bypass simulation for this controlled revert test.
    const hash = await walletClient.writeContract({
      address: CONTRACT,
      abi,
      functionName: "registerBatch",
      args: [existingBatchId, 500n],
      account,
      chain: didlab,
      gas: 300000n
    });

    status.textContent = "Transaction pending: " + hash;

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 120000
    });

    if (receipt.status === "reverted") {
      status.textContent =
        "ON-CHAIN REVERT CONFIRMED\n" +
        "Reason: Duplicate batch BEEF-001\n" +
        "Transaction: " + hash + "\n" +
        "Block: " + receipt.blockNumber + "\n" +
        "Receipt status: reverted";
    } else {
      status.textContent =
        "Unexpected success. Transaction: " + hash;
    }

    console.log("Revert test receipt:", receipt);

  } catch (error) {
    status.textContent =
      "Test error: " + (error.shortMessage ?? error.message);

    console.error("Revert test error:", error);
  } finally {
    button.disabled = false;
  }
}

document.getElementById("revertTest")
  .addEventListener("click", testOnChainRevert);
const eventStatus = document.getElementById("eventStatus");
const eventLog = document.getElementById("eventLog");

const unwatch = publicClient.watchContractEvent({
  address: CONTRACT,
  abi,
  eventName: "BatchRegistered",
  pollingInterval: 2000,
  onLogs: async (logs) => {
    for (const log of logs) {
      eventStatus.textContent = "BatchRegistered event detected!";

      eventLog.textContent =
        "Transaction: " + log.transactionHash + "\n" +
        "Block: " + log.blockNumber + "\n" +
        "Batch ID: " + log.args.batchId + "\n" +
        "Processor: " + log.args.processor + "\n" +
        "Weight: " + log.args.weightLbs + " lbs";

      // Update the selected batch when a blockchain event occurs.
      activeBatchId = log.args.batchId;

      document.getElementById("batchLabel").textContent =
      "Batch ID: " + log.args.batchId;

      await loadState();
    }
  },
  onError: (error) => {
    eventStatus.textContent = "Event listener error.";
    console.error(error);
  }
});
async function verifyRevert() {
  const status = document.getElementById("verifyStatus");
  const button = document.getElementById("verifyRevert");

  button.disabled = true;
  status.textContent = "Checking reverted transaction...";

  try {
    const revertedHash =
      "0x94f09199c2df0ebfb753066de0389789402fe9ca599bd4cd6b369795deb08677";

    const receipt = await publicClient.getTransactionReceipt({
      hash: revertedHash
    });

    const batchId = padHex(stringToHex("BEEF-001"), {
      size: 32,
      dir: "right"
    });

    const batch = await publicClient.readContract({
      address: CONTRACT,
      abi,
      functionName: "getBatch",
      args: [batchId]
    });

    const batchEvents = receipt.logs.filter(
      (log) => log.address.toLowerCase() === CONTRACT.toLowerCase()
    );

    status.textContent =
      "Transaction status: " + receipt.status + "\n" +
      "Contract event logs in receipt: " + batchEvents.length + "\n" +
      "Original batch weight: " + batch[1] + " lbs\n" +
      "Original processor: " + batch[0] + "\n" +
      "Batch still exists: YES";

  } catch (error) {
    status.textContent =
      "Verification failed: " + (error.shortMessage ?? error.message);
    console.error(error);
  } finally {
    button.disabled = false;
  }
}

document.getElementById("verifyRevert")
  .addEventListener("click", verifyRevert);
