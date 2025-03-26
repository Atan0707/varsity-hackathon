// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title SimpleDAO
 * @dev A simple DAO contract for proposal creation and voting
 */
contract SimpleDAO {
    // Token contract used for governance
    address public governanceToken;
    
    // Struct to store proposal details
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteDirection; // true = for, false = against
    }
    
    // Mapping from proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    
    // Total number of proposals created
    uint256 public proposalCount;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint256 startTime, uint256 endTime);
    event Voted(uint256 indexed proposalId, address indexed voter, bool direction, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    
    // Constructor sets the governance token address
    constructor(address _governanceToken) {
        governanceToken = _governanceToken;
    }
    
    // Modifier to check if a proposal is active
    modifier proposalActive(uint256 proposalId) {
        require(proposals[proposalId].startTime <= block.timestamp, "Proposal not started");
        require(proposals[proposalId].endTime >= block.timestamp, "Proposal ended");
        require(!proposals[proposalId].executed, "Proposal already executed");
        _;
    }
    
    // Function to create a new proposal
    function createProposal(string memory title, string memory description, uint256 durationInDays) external returns (uint256) {
        // Could add token balance check here
        // require(IERC20(governanceToken).balanceOf(msg.sender) >= minProposalThreshold, "Insufficient tokens to create proposal");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + (durationInDays * 1 days);
        newProposal.forVotes = 0;
        newProposal.againstVotes = 0;
        newProposal.executed = false;
        
        emit ProposalCreated(proposalId, msg.sender, title, newProposal.startTime, newProposal.endTime);
        
        return proposalId;
    }
    
    // Function to cast a vote on a proposal
    function castVote(uint256 proposalId, bool support) external proposalActive(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // In a real implementation, you would calculate voting power based on token holdings
        uint256 votingPower = 1; // Simplified for this example
        
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        proposal.hasVoted[msg.sender] = true;
        proposal.voteDirection[msg.sender] = support;
        
        emit Voted(proposalId, msg.sender, support, votingPower);
    }
    
    // Function to execute a proposal after voting period ends
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal did not pass");
        
        proposal.executed = true;
        
        // In a real implementation, you would execute the proposal action here
        // This could be a call to another contract or a function within this contract
        
        emit ProposalExecuted(proposalId);
    }
    
    // Function to get basic proposal information
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed
        );
    }
    
    // Function to check if an address has voted on a proposal
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
    
    // Function to check which way an address voted
    function getVoteDirection(uint256 proposalId, address voter) external view returns (bool) {
        require(proposals[proposalId].hasVoted[voter], "Address has not voted");
        return proposals[proposalId].voteDirection[voter];
    }
} 