import { ethers } from "ethers";
import NeuralCreatorTradingAbi from "../../attached_assets/abis/NeuralCreatorTrading.json" assert { type: "json" };

export function getProvider() {
  const rpc = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  return new ethers.JsonRpcProvider(rpc);
}

export function getSigner() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY required");
  return new ethers.Wallet(pk, getProvider());
}

export function getTradingContract() {
  const address = process.env.TRADING_CONTRACT_ADDRESS;
  if (!address) throw new Error("TRADING_CONTRACT_ADDRESS required");
  const signer = getSigner();
  return new ethers.Contract(address, NeuralCreatorTradingAbi, signer);
}

export function hashDecision(decision: any): string {
  const encoded = ethers.toUtf8Bytes(JSON.stringify(decision));
  return ethers.keccak256(encoded);
}