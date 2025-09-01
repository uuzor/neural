import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

let brokerPromise: ReturnType<typeof createZGComputeNetworkBroker> | null = null;

export async function getBroker() {
  if (brokerPromise) return brokerPromise;

  const rpcUrl = process.env.OG_RPC_URL || "https://evmrpc-testnet.0g.ai";
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY is required for 0G broker");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);

  brokerPromise = createZGComputeNetworkBroker(wallet);
  return brokerPromise;
}

export async function getProviders() {
  const broker = await getBroker();
  const services = await broker.discovery.listProviders(); // discovery API
  return services;
}

export type InferenceRequest = {
  model: string;
  input: any;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  generateProof?: boolean;
};

export async function runInference(req: InferenceRequest) {
  const broker = await getBroker();

  // Construct a generic request; adapt as the broker API evolves
  const response = await broker.inference.send({
    model: req.model,
    input: req.input,
    provider: req.provider,
    options: {
      maxTokens: req.maxTokens ?? 512,
      temperature: req.temperature ?? 0.2,
      generateProof: req.generateProof ?? true
    }
  });

  // Expected fields: output, proof, modelHash, cost, requestId, provider
  return {
    requestId: response.requestId,
    output: response.output,
    proof: response.proof,
    modelHash: response.modelHash,
    provider: response.provider,
    cost: response.cost
  };
}