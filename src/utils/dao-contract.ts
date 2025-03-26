import { ethers, Eip1193Provider, Contract } from "ethers";
import daoAbi from "@/contract/dao-abi.json";

// In a real application, this would be the deployed contract address
const DAO_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Interface representing a proposal from the DAO contract
 */
export interface DAOProposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  forVotes: number;
  againstVotes: number;
  executed: boolean;
}

/**
 * Get a contract instance for the DAO with signer
 */
export const getDaoContract = async (walletProvider: unknown): Promise<Contract> => {
  try {
    const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
    const signer = await provider.getSigner();
    return new ethers.Contract(DAO_CONTRACT_ADDRESS, daoAbi, signer);
  } catch (error) {
    console.error('Error getting DAO contract:', error);
    throw error;
  }
};

/**
 * Get a read-only contract instance for the DAO
 */
export const getReadOnlyDaoContract = (): Contract => {
  try {
    // For read-only operations, use a provider instead of a signer
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/');
    return new ethers.Contract(DAO_CONTRACT_ADDRESS, daoAbi, provider);
  } catch (error) {
    console.error('Error getting read-only DAO contract:', error);
    throw error;
  }
};

/**
 * Create a new proposal
 */
export async function createProposal(title: string, description: string, durationInDays: number, walletProvider: unknown) {
  try {
    const contract = await getDaoContract(walletProvider);
    const tx = await contract.createProposal(title, description, durationInDays);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error creating proposal:", error);
    return false;
  }
}

/**
 * Cast a vote on a proposal
 */
export async function castVote(proposalId: number, support: boolean, walletProvider: unknown) {
  try {
    const contract = await getDaoContract(walletProvider);
    const tx = await contract.castVote(proposalId, support);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error casting vote:", error);
    return false;
  }
}

/**
 * Execute a proposal
 */
export async function executeProposal(proposalId: number, walletProvider: unknown) {
  try {
    const contract = await getDaoContract(walletProvider);
    const tx = await contract.executeProposal(proposalId);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error executing proposal:", error);
    return false;
  }
}

/**
 * Get proposal details
 */
export async function getProposal(proposalId: number): Promise<DAOProposal | null> {
  try {
    const contract = getReadOnlyDaoContract();
    const proposal = await contract.getProposal(proposalId);
    
    return {
      id: proposalId,
      proposer: proposal.proposer,
      title: proposal.title,
      description: proposal.description,
      startTime: parseInt(proposal.startTime.toString()),
      endTime: parseInt(proposal.endTime.toString()),
      forVotes: parseInt(proposal.forVotes.toString()),
      againstVotes: parseInt(proposal.againstVotes.toString()),
      executed: proposal.executed
    };
  } catch (error) {
    console.error("Error getting proposal:", error);
    return null;
  }
}

/**
 * Get proposal count
 */
export async function getProposalCount(): Promise<number> {
  try {
    const contract = getReadOnlyDaoContract();
    const count = await contract.proposalCount();
    return parseInt(count.toString());
  } catch (error) {
    console.error("Error getting proposal count:", error);
    return 0;
  }
}

/**
 * Check if an address has voted on a proposal
 */
export async function hasVoted(proposalId: number, voterAddress: string): Promise<boolean> {
  try {
    const contract = getReadOnlyDaoContract();
    return await contract.hasVoted(proposalId, voterAddress);
  } catch (error) {
    console.error("Error checking if address has voted:", error);
    return false;
  }
}

/**
 * Get vote direction (for or against)
 */
export async function getVoteDirection(proposalId: number, voterAddress: string): Promise<boolean | null> {
  try {
    const contract = getReadOnlyDaoContract();
    const hasVotedResult = await contract.hasVoted(proposalId, voterAddress);
    
    if (!hasVotedResult) {
      return null;
    }
    
    return await contract.getVoteDirection(proposalId, voterAddress);
  } catch (error) {
    console.error("Error getting vote direction:", error);
    return null;
  }
}

/**
 * Get all proposals (helper function for UI)
 */
export async function getAllProposals(): Promise<DAOProposal[]> {
  try {
    const count = await getProposalCount();
    const proposals: DAOProposal[] = [];
    
    for (let i = 1; i <= count; i++) {
      const proposal = await getProposal(i);
      if (proposal) {
        proposals.push(proposal);
      }
    }
    
    return proposals;
  } catch (error) {
    console.error("Error getting all proposals:", error);
    return [];
  }
} 