// 0G Storage & Indexer utilities
import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";

let indexer: Indexer | null = null;

function getIndexer() {
  if (indexer) return indexer;
  const indexerRpc = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  indexer = new Indexer(indexerRpc);
  return indexer;
}

function getSigner() {
  const rpc = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY required");
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Wallet(pk, provider);
}

export async function storeObject(obj: any): Promise<string> {
  const file = await ZgFile.fromObject(obj);
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

  const idx = getIndexer();
  const signer = getSigner();
  const [tx, uploadErr] = await idx.upload(file, process.env.OG_STORAGE_URL, signer as any);
  if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

  return tree.rootHash();
}

export async function storeBuffer(buf: Buffer): Promise<string> {
  const file = await ZgFile.fromBuffer(buf);
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

  const idx = getIndexer();
  const signer = getSigner();
  const [tx, uploadErr] = await idx.upload(file, process.env.OG_STORAGE_URL, signer as any);
  if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

  return tree.rootHash();
}