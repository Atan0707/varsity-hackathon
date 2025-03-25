import { ethers, Eip1193Provider, Contract } from 'ethers';
import contractABI from '@/contract/abi.json';
import { Pool } from './poolData';
import { CONTRACT_ADDRESS } from './config';


export const getContract = async (walletProvider: unknown): Promise<Contract> => {
  try {
    const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

export const getReadOnlyContract = (): Contract => {
  try {
    // For read-only operations, use a provider instead of a signer
    const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.scroll.io/'); // Example RPC URL (Sepolia testnet)
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
  } catch (error) {
    console.error('Error getting read-only contract:', error);
    throw error;
  }
};

export const getAllPoolsFromChain = async (): Promise<Pool[]> => {
  try {
    const contract = getReadOnlyContract();
    const [ids, names, activeStatus, totalDonated] = await contract.getAllPools();
    
    // Create pool objects from blockchain data
    const pools = ids.map((id: bigint, index: number) => {
      const poolId = Number(id);
      const totalAmount = Number(totalDonated[index]);
      
      return {
        id: poolId.toString(),
        title: names[index],
        tagline: '', // This isn't stored in the contract
        categories: [], // These aren't stored in the contract
        badges: [], // These aren't stored in the contract
        videoUrl: '', // This isn't stored in the contract
        status: activeStatus[index] ? 'Live' : 'Closed',
        currentAmount: totalAmount / 1e18, // Convert from wei to ether
        targetAmount: 0, // Not directly available from the contract
        percentageRaised: 0, // Will be calculated once we have target amount
        donors: 0, // Will be fetched separately
        largestInvestment: 0, // Not directly available from the contract
        daysLeft: 0, // Not directly available from the contract
        logoUrl: '', // Will be fetched separately
        description: '', // This isn't stored in the contract
      };
    });
    
    // Fetch logo URIs for each pool
    const poolsWithLogos = await Promise.all(pools.map(async (pool: Pool) => {
      try {
        const logoURI = await getPoolLogoURI(Number(pool.id));
        return {
          ...pool,
          logoUrl: logoURI || '/logos/habibi.jpg', // Use blockchain URI if available, else use placeholder
        };
      } catch (error) {
        console.error(`Error fetching logo for pool ${pool.id}:`, error);
        return pool;
      }
    }));
    
    return poolsWithLogos;
  } catch (error) {
    console.error('Error getting pools from chain:', error);
    return [];
  }
};

export const getPoolLogoURI = async (poolId: number): Promise<string | undefined> => {
  try {
    const contract = getReadOnlyContract();
    // Get items from the pool - destructure only what we need
    const [, , imageURIs] = await contract.getPoolItemsWithDetails(poolId);
    
    // Return the first item's image URI if it exists
    if (imageURIs && imageURIs.length > 0) {
      return imageURIs[0];
    }
    
    return undefined;
  } catch (error) {
    console.error('Error getting pool logo URI:', error);
    return undefined;
  }
};

export const getPoolByIdFromChain = async (id: string, walletProvider?: unknown): Promise<Pool | undefined> => {
  try {
    const contract = walletProvider ? 
      await getContract(walletProvider) : 
      getReadOnlyContract();
    
    const poolId = Number(id);
    
    // Get pool details from the contract
    const [
      name,
      totalDonated,
      , // Skip totalWithdrawn
      active,
      checkpoints,
      currentCheckpointIndex,
      checkpointReleaseStatus
    ] = await contract.getPoolDetails(poolId);
    
    // Get pool items to count donors
    const itemTokens = await contract.getPoolItems(poolId);
    const donorCount = itemTokens.length;
    
    // Convert totalDonated from wei to ether
    const donatedAmount = Number(totalDonated) / 1e18;
    
    // For demonstration purposes, we'll set some placeholder values
    const targetAmount = donatedAmount * 1.5; // Just an example
    const percentageRaised = Math.min(Math.floor((donatedAmount / targetAmount) * 100), 100);
    
    // Try to get the logo URI from the first pool item
    const logoURI = await getPoolLogoURI(poolId);
    
    return {
      id: id,
      title: name,
      tagline: `${name} Crowdfunding Pool`,
      categories: ['CROWDFUNDING',],
      badges: active ? ['ACTIVE'] : ['INACTIVE'],
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
      status: active ? 'Live' : 'Closed',
      currentAmount: donatedAmount,
      targetAmount: targetAmount,
      percentageRaised: percentageRaised,
      donors: donorCount,
      largestInvestment: donatedAmount * 0.3, // Just an example
      daysLeft: active ? 14 : 0, // Just an example
      logoUrl: logoURI || '/logos/habibi.jpg', // Use blockchain URI if available, else use placeholder
      description: `This crowdfunding pool for ${name} is a platform for individuals and organizations to raise funds for their projects.`,
      checkpoints, 
      currentCheckpointIndex: Number(currentCheckpointIndex),
      checkpointReleaseStatus
    };
  } catch (error) {
    console.error('Error getting pool by ID from chain:', error);
    return undefined;
  }
};

export const donateToPool = async (poolId: number, amount: string, walletProvider: unknown): Promise<boolean> => {
  try {
    const contract = await getContract(walletProvider);
    
    // Convert amount from ether to wei
    const amountInWei = ethers.parseEther(amount);
    
    // Call the donate function with the specified amount
    const tx = await contract.donate(poolId, { value: amountInWei });
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error('Error donating to pool:', error);
    return false;
  }
};

export interface Donator {
  address: string;
  amount: number;
  timestamp: number;
}

export const getPoolDonators = async (poolId: string): Promise<Donator[]> => {
  try {
    const contract = getReadOnlyContract();
    const provider = contract.runner as ethers.JsonRpcProvider;
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Define chunk size (to stay within RPC limitations)
    const CHUNK_SIZE = 5000;
    
    // Calculate a reasonable starting block (e.g., 30 days ago)
    // Using ~13s per block, 30 days = ~200,000 blocks
    let startBlock = Math.max(currentBlock - 200000, 0);
    
    const allEvents = [];
    
    // Fetch events in chunks
    while (startBlock <= currentBlock) {
      const endBlock = Math.min(startBlock + CHUNK_SIZE, currentBlock);
      
      try {
        console.log(`Fetching events from block ${startBlock} to ${endBlock}`);
        const filter = contract.filters.DonationReceived();
        const events = await contract.queryFilter(filter, startBlock, endBlock);
        allEvents.push(...events);
      } catch (error) {
        console.error(`Error fetching chunk from ${startBlock} to ${endBlock}:`, error);
      }
      
      // Move to next chunk
      startBlock = endBlock + 1;
    }
    
    // Process and filter events for the specific pool
    const donatorMap = new Map<string, Donator>(); // Use Map to deduplicate by address
    
    for (const event of allEvents) {
      // Type assertion for ethers event
      const { args } = event as unknown as { args: [string, bigint, bigint] };
      const [donor, eventPoolId, amount] = args || [];
      
      // Skip if not matching the requested pool
      if (Number(eventPoolId) !== Number(poolId)) {
        continue;
      }
      
      // Get block timestamp for the event
      const block = await event.getBlock();
      const timestamp = block.timestamp * 1000; // Convert to JS timestamp (ms)
      const amountInEther = Number(amount) / 1e18;
      
      // If donor exists in map, add to their amount and update timestamp if more recent
      if (donatorMap.has(donor)) {
        const existing = donatorMap.get(donor)!;
        // Sum the amounts
        existing.amount += amountInEther;
        // Update timestamp if this event is more recent
        if (timestamp > existing.timestamp) {
          existing.timestamp = timestamp;
        }
      } else {
        // New donor
        donatorMap.set(donor, {
          address: donor,
          amount: amountInEther,
          timestamp: timestamp
        });
      }
    }
    
    // Convert Map to array and sort by timestamp (newest first)
    return Array.from(donatorMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting pool donators:', error);
    return [];
  }
}; 