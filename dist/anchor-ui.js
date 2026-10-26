
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  defineChain,
  keccak256,
  stringToHex
} from "https://esm.sh/viem@2";

const chain = defineChain({
  id: 252501,
  name: "DIDLab",
  nativeCurrency: {
    name: "TRUST",
    symbol: "TRUST",
    decimals: 18
  },
  rpcUrls: {
    default: { http: ["https://eth.didlab.org"] }
  }
});

const CONTRACT = "0xce25f3fb25076c5f667813e6979c1a866bd39e0f";

const abi = [
  {
    type: "function",
    name: "SUBMITTER",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }]
  },
  {
    type: "function",
    name: "VERIFIER",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }]
  },
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    type: "function",
    name: "anchor",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "digest", type: "bytes32" },
      { name: "cid", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "verify",
    stateMutability: "nonpayable",
    inputs: [{ name: "recordId", type: "bytes32" }],
    outputs: []
  },
  {
    type: "function",
    name: "get",
    stateMutability: "view",
    inputs: [{ name: "recordId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "digest", type: "bytes32" },
          { name: "cid", type: "string" },
          { name: "submitter", type: "address" },
          { name: "submittedAt", type: "uint256" },
          { name: "verifier", type: "address" },
          { name: "verifiedAt", type: "uint256" }
        ]
      }
    ]
  }
];

const $ = (id) => document.getElementById(id);

const publicClient = createPublicClient({
  chain,
  transport: http()
});

let walletClient;
let account;

const recordKey = (id) => keccak256(stringToHex(id.trim()));

function errorText(error) {
  return error.shortMessage ?? error.message ?? String(error);
}

async function loadRoles() {
  $("anchorPanel").hidden = true;
  $("verifyPanel").hidden = true;

  if (!account) {
    $("anchorRoles").textContent = "Connect a wallet first.";
    return;
  }

  const submitterRole = await publicClient.readContract({
    address: CONTRACT,
    abi,
    functionName: "SUBMITTER"
  });

  const verifierRole = await publicClient.readContract({
    address: CONTRACT,
    abi,
    functionName: "VERIFIER"
  });

  const isSubmitter = await publicClient.readContract({
    address: CONTRACT,
    abi,
    functionName: "hasRole",
    args: [submitterRole, account]
  });

  const isVerifier = await publicClient.readContract({
    address: CONTRACT,
    abi,
    functionName: "hasRole",
    args: [verifierRole, account]
  });

  $("anchorPanel").hidden = !isSubmitter;
  $("verifyPanel").hidden = !isVerifier;

  $("anchorRoles").textContent =
    `SUBMITTER: ${isSubmitter} | VERIFIER: ${isVerifier}`;
}

async function connect() {
  if (!window.ethereum) {
    $("anchorWallet").textContent = "MetaMask not detected.";
    return;
  }

  try {
    walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum)
    });

    const accounts = await walletClient.requestAddresses();
    const chainId = await walletClient.getChainId();

    if (chainId !== chain.id) {
      await walletClient.switchChain({ id: chain.id });
    }

    account = accounts[0];
    $("anchorWallet").textContent = `Connected: ${account}`;

    await loadRoles();
  } catch (error) {
    account = null;
    $("anchorPanel").hidden = true;
    $("verifyPanel").hidden = true;
    $("anchorWallet").textContent = `Error: ${errorText(error)}`;
  }
}

async function lookup() {
  const id = $("lookupRecordId").value.trim();

  if (!id) {
    $("anchorRecordDetails").textContent = "Enter a record ID.";
    return;
  }

  try {
    const record = await publicClient.readContract({
      address: CONTRACT,
      abi,
      functionName: "get",
      args: [recordKey(id)]
    });

    $("anchorRecordDetails").textContent = JSON.stringify({
      recordId: id,
      digest: record.digest,
      cid: record.cid,
      submitter: record.submitter,
      submittedAt: record.submittedAt.toString(),
      verifier: record.verifier,
      verifiedAt: record.verifiedAt.toString(),
      verified: record.verifiedAt > 0n
    }, null, 2);
  } catch (error) {
    $("anchorRecordDetails").textContent = errorText(error);
  }
}

async function anchor() {
  const status = $("anchorSubmitStatus");
  const button = $("anchorSubmit");

  try {
    if (!account) throw new Error("Connect MetaMask first.");

    const id = $("anchorRecordId").value.trim();
    const digest = $("anchorDigest").value.trim();
    const cid = $("anchorCid").value.trim();

    if (!id || !cid || !/^0x[0-9a-fA-F]{64}$/.test(digest)) {
      throw new Error("Enter a record ID, valid bytes32 digest, and CID.");
    }

    button.disabled = true;
    status.textContent = "Simulating anchor transaction...";

    const { request } = await publicClient.simulateContract({
      address: CONTRACT,
      abi,
      functionName: "anchor",
      args: [recordKey(id), digest, cid],
      account
    });

    status.textContent = "Approve transaction in MetaMask.";

    const hash = await walletClient.writeContract(request);
    status.textContent = `Pending: ${hash}`;

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    status.textContent = `Status: ${receipt.status}\nTransaction: ${hash}`;
    await lookup();
  } catch (error) {
    status.textContent = `Anchor failed: ${errorText(error)}`;
  } finally {
    button.disabled = false;
  }
}

async function verify() {
  const status = $("anchorVerifyStatus");
  const button = $("anchorVerify");

  try {
    if (!account) throw new Error("Connect MetaMask first.");

    const id = $("verifyRecordId").value.trim();
    if (!id) throw new Error("Enter a record ID.");

    button.disabled = true;
    status.textContent = "Simulating verification...";

    const { request } = await publicClient.simulateContract({
      address: CONTRACT,
      abi,
      functionName: "verify",
      args: [recordKey(id)],
      account
    });

    status.textContent = "Approve transaction in MetaMask.";

    const hash = await walletClient.writeContract(request);
    status.textContent = `Pending: ${hash}`;

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    status.textContent = `Status: ${receipt.status}\nTransaction: ${hash}`;
    await lookup();
  } catch (error) {
    status.textContent = `Verification failed: ${errorText(error)}`;
  } finally {
    button.disabled = false;
  }
}

$("anchorConnect").addEventListener("click", connect);
$("anchorLookup").addEventListener("click", lookup);
$("anchorSubmit").addEventListener("click", anchor);
$("anchorVerify").addEventListener("click", verify);

window.ethereum?.on?.("accountsChanged", () => location.reload());
window.ethereum?.on?.("chainChanged", () => location.reload());

await lookup();
