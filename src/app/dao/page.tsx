"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
// Import the DAO contract utilities (commented out because we use mock data)
// import * as daoContract from "@/utils/dao-contract";

interface Proposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  startTime: number;
  endTime: number;
  forVotes: number;
  againstVotes: number;
  executed: boolean;
  votes: Record<string, "for" | "against" | undefined>;
}

export default function DAOPage() {
  const { address, isConnected } = useAppKitAccount();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    durationDays: 7,
  });
  const [activeTab, setActiveTab] = useState<"active" | "closed" | "create">("active");
  const [mounted, setMounted] = useState(false);

  // Mock loading proposals from blockchain
  useEffect(() => {
    setMounted(true);
    
    // In a real application, we would call the contract:
    // const loadProposals = async () => {
    //   try {
    //     const chainProposals = await daoContract.getAllProposals();
    //     // Transform contract format to UI format
    //     const uiProposals = chainProposals.map(p => ({
    //       ...p,
    //       creator: p.proposer,
    //       votes: {}
    //     }));
    //     setProposals(uiProposals);
    //   } catch (error) {
    //     console.error("Error loading proposals:", error);
    //     toast.error("Failed to load proposals");
    //   }
    // };
    // loadProposals();
    
    // Mock data for proposals
    const mockProposals: Proposal[] = [
      {
        id: 1,
        title: "Fund Aman Syria Project",
        description: "Allocate 5 ETH to support the Aman Syria Project.",
        creator: "0x1234...5678",
        startTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        endTime: Date.now() + 4 * 24 * 60 * 60 * 1000, // 4 days from now
        forVotes: 12,
        againstVotes: 3,
        executed: false,
        votes: {},
      },
      {
        id: 2,
        title: "Upgrade Smart Contract",
        description: "Vote to upgrade the DAO smart contract to improve security features.",
        creator: "0x8765...4321",
        startTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        endTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
        forVotes: 25,
        againstVotes: 1,
        executed: false,
        votes: {},
      },
      {
        id: 3,
        title: "Treasury Allocation for Education",
        description: "Allocate 10% of treasury to educational initiatives in blockchain.",
        creator: "0x9876...2345",
        startTime: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        endTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // ended 3 days ago
        forVotes: 32,
        againstVotes: 15,
        executed: true,
        votes: {},
      },
    ];
    
    setProposals(mockProposals);
  }, []);

  // Handle proposal submission
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!newProposal.title || !newProposal.description) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // In a real application, we would call the contract:
    // try {
    //   const provider = await window.ethereum;
    //   const success = await daoContract.createProposal(
    //     newProposal.title,
    //     newProposal.description,
    //     newProposal.durationDays,
    //     provider
    //   );
    //   
    //   if (success) {
    //     toast.success("Proposal created successfully!");
    //     setNewProposal({ title: "", description: "", durationDays: 7 });
    //     setActiveTab("active");
    //     // Reload proposals
    //     // loadProposals();
    //   } else {
    //     toast.error("Failed to create proposal");
    //   }
    // } catch (error) {
    //   console.error("Error creating proposal:", error);
    //   toast.error("Error creating proposal");
    // }
    
    // For now, create mock proposal
    const newProposalObj: Proposal = {
      id: proposals.length + 1,
      title: newProposal.title,
      description: newProposal.description,
      creator: address || "Unknown",
      startTime: Date.now(),
      endTime: Date.now() + newProposal.durationDays * 24 * 60 * 60 * 1000,
      forVotes: 0,
      againstVotes: 0,
      executed: false,
      votes: {},
    };
    
    setProposals([...proposals, newProposalObj]);
    setNewProposal({ title: "", description: "", durationDays: 7 });
    toast.success("Proposal created successfully!");
    setActiveTab("active");
  };

  // Handle voting
  const handleVote = async (proposalId: number, voteType: "for" | "against") => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // In a real application, we would call the contract:
    // try {
    //   const provider = await window.ethereum;
    //   const success = await daoContract.castVote(
    //     proposalId,
    //     voteType === "for", // true for "for", false for "against"
    //     provider
    //   );
    //   
    //   if (success) {
    //     toast.success(`Vote ${voteType} submitted!`);
    //     // Reload proposals
    //     // loadProposals();
    //   } else {
    //     toast.error("Failed to cast vote");
    //   }
    // } catch (error) {
    //   console.error("Error casting vote:", error);
    //   toast.error("Error casting vote");
    // }
    
    // For now, update the mock data
    setProposals(proposals.map(proposal => {
      if (proposal.id === proposalId && address) {
        // If user already voted, remove their previous vote
        const previousVote = proposal.votes[address];
        let forVotes = proposal.forVotes;
        let againstVotes = proposal.againstVotes;
        
        if (previousVote === "for") forVotes--;
        if (previousVote === "against") againstVotes--;
        
        // Add new vote
        if (voteType === "for") forVotes++;
        else againstVotes++;
        
        return {
          ...proposal,
          forVotes,
          againstVotes,
          votes: {
            ...proposal.votes,
            [address]: voteType
          }
        };
      }
      return proposal;
    }));
    
    toast.success(`Vote ${voteType} submitted!`);
  };

  // Filter proposals based on active tab
  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === "active") {
      return proposal.endTime > Date.now() && !proposal.executed;
    } else {
      return proposal.endTime <= Date.now() || proposal.executed;
    }
  });

  // Format time remaining
  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const diff = endTime - now;
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };

  // Format address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[rgba(15,45,50,255)] mb-4">GlassFund DAO</h1>
          <p className="text-lg text-[rgba(15,45,50,0.8)] max-w-3xl mx-auto">
            Participate in governance by creating proposals and voting on important decisions.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-10">
          <div className="flex border-b">
            <button
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === "active" 
                  ? "bg-[rgba(15,45,50,0.1)] text-[rgba(15,45,50,255)]" 
                  : "text-[rgba(15,45,50,0.7)] hover:bg-[rgba(15,45,50,0.05)]"
              }`}
              onClick={() => setActiveTab("active")}
            >
              Active Proposals
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === "closed" 
                  ? "bg-[rgba(15,45,50,0.1)] text-[rgba(15,45,50,255)]" 
                  : "text-[rgba(15,45,50,0.7)] hover:bg-[rgba(15,45,50,0.05)]"
              }`}
              onClick={() => setActiveTab("closed")}
            >
              Closed Proposals
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === "create" 
                  ? "bg-[rgba(15,45,50,0.1)] text-[rgba(15,45,50,255)]" 
                  : "text-[rgba(15,45,50,0.7)] hover:bg-[rgba(15,45,50,0.05)]"
              }`}
              onClick={() => setActiveTab("create")}
            >
              Create Proposal
            </button>
          </div>

          <div className="p-6">
            {activeTab === "create" ? (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-[rgba(15,45,50,255)] mb-6">Create New Proposal</h2>
                
                {!isConnected && (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6">
                    Please connect your wallet to create a proposal.
                  </div>
                )}
                
                <form onSubmit={handleSubmitProposal}>
                  <div className="mb-4">
                    <label className="block text-[rgba(15,45,50,0.8)] font-medium mb-2">
                      Title*
                    </label>
                    <input
                      type="text"
                      value={newProposal.title}
                      onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgba(15,45,50,0.4)]"
                      placeholder="Enter proposal title"
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-[rgba(15,45,50,0.8)] font-medium mb-2">
                      Description*
                    </label>
                    <textarea
                      value={newProposal.description}
                      onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgba(15,45,50,0.4)] min-h-[150px]"
                      placeholder="Describe your proposal in detail"
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-[rgba(15,45,50,0.8)] font-medium mb-2">
                      Voting Duration (days)
                    </label>
                    <input
                      type="number"
                      value={newProposal.durationDays}
                      onChange={(e) => setNewProposal({...newProposal, durationDays: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgba(15,45,50,0.4)]"
                      min="1"
                      max="30"
                      disabled={!isConnected}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-[rgba(15,45,50,255)] text-white py-3 px-6 rounded-lg font-medium hover:bg-[rgba(15,45,50,0.9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isConnected}
                  >
                    Submit Proposal
                  </button>
                </form>
              </div>
            ) : (
              <div>
                {filteredProposals.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-[rgba(15,45,50,0.7)] text-lg">
                      No {activeTab} proposals found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredProposals.map((proposal) => (
                      <div 
                        key={proposal.id} 
                        className="border rounded-lg overflow-hidden bg-[#FAFAFA] hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-[rgba(15,45,50,255)]">
                              {proposal.title}
                            </h3>
                            <div className="text-sm text-[rgba(15,45,50,0.6)]">
                              {proposal.executed ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Executed</span>
                              ) : proposal.endTime < Date.now() ? (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Ended</span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {formatTimeRemaining(proposal.endTime)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-[rgba(15,45,50,0.8)] mb-4">
                            {proposal.description}
                          </p>
                          
                          <div className="flex items-center text-sm text-[rgba(15,45,50,0.6)] mb-6">
                            <span>Created by {formatAddress(proposal.creator)}</span>
                          </div>
                          
                          <div className="mb-6">
                            <div className="flex justify-between mb-2">
                              <span className="text-[rgba(15,45,50,0.7)]">For: {proposal.forVotes}</span>
                              <span className="text-[rgba(15,45,50,0.7)]">Against: {proposal.againstVotes}</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ 
                                  width: `${proposal.forVotes + proposal.againstVotes === 0 
                                    ? 0 
                                    : (proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                          
                          {proposal.endTime > Date.now() && !proposal.executed && (
                            <div className="flex space-x-4">
                              <button
                                onClick={() => handleVote(proposal.id, "for")}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                                  address && proposal.votes[address] === "for"
                                    ? "bg-green-500 text-white"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                }`}
                                disabled={!isConnected}
                              >
                                Vote For
                              </button>
                              <button
                                onClick={() => handleVote(proposal.id, "against")}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                                  address && proposal.votes[address] === "against"
                                    ? "bg-red-500 text-white"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
                                disabled={!isConnected}
                              >
                                Vote Against
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-[rgba(15,45,50,255)] mb-4">About GlassFund DAO</h2>
          <p className="text-[rgba(15,45,50,0.8)] mb-4">
            GlassFund DAO allows community members to participate in governance 
            decisions by creating and voting on proposals. Any token holder can create proposals and cast votes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-[rgba(15,45,50,0.05)] p-4 rounded-lg">
              <h3 className="font-bold text-[rgba(15,45,50,255)] mb-2">Create Proposals</h3>
              <p className="text-[rgba(15,45,50,0.7)]">
                Any member can create proposals for community consideration.
              </p>
            </div>
            <div className="bg-[rgba(15,45,50,0.05)] p-4 rounded-lg">
              <h3 className="font-bold text-[rgba(15,45,50,255)] mb-2">Vote on Decisions</h3>
              <p className="text-[rgba(15,45,50,0.7)]">
                Cast your vote on active proposals to influence collective decisions.
              </p>
            </div>
            <div className="bg-[rgba(15,45,50,0.05)] p-4 rounded-lg">
              <h3 className="font-bold text-[rgba(15,45,50,255)] mb-2">Execute Actions</h3>
              <p className="text-[rgba(15,45,50,0.7)]">
                Successful proposals are automatically executed on-chain.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
