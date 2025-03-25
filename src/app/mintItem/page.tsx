"use client";

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider } from "ethers";
import { ethers } from "ethers";
import { useState } from "react";
import { CONTRACT_ADDRESS } from "@/utils/config";
import ABI from "../../contract/abi.json"

export default function Home() {
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155")
    const [message, setMessage] = useState("");
    const [writeStatus, setWriteStatus] = useState<
        "idle" | "writing" | "success" | "error"
    >("idle");
    const [writeErrorMessage, setWriteErrorMessage] = useState("");

    // Add state for NFT creation
    const [nftName, setNftName] = useState("");
    const [nftImageURI, setNftImageURI] = useState("");
    const [poolId, setPoolId] = useState("0");
    const [location, setLocation] = useState("");
    const [txHash, setTxHash] = useState("");

    // Add state to track if NFT has been minted successfully
    const [nftMinted, setNftMinted] = useState(false);

    // Check if Web NFC is supported
    const isNfcSupported =
        typeof window !== "undefined" && "NDEFReader" in window;

    // Write function
    async function handleWrite() {
        if (!isNfcSupported) {
            setWriteStatus("error");
            setWriteErrorMessage(
                "Web NFC is not supported in this browser. Try Chrome on Android."
            );
            return;
        }

        try {
            setWriteStatus("writing");
            setWriteErrorMessage("");

            // @ts-expect-error - TypeScript might not have NDEFReader types
            const ndef = new NDEFReader();
            await ndef.write({
                records: [
                    { recordType: "text", data: message },
                ],
            });

            setWriteStatus("success");
        } catch (error) {
            console.error(error);
            setWriteStatus("error");
            setWriteErrorMessage(
                error instanceof Error ? error.message : "Failed to write to NFC tag"
            );
        }
    }

    const handleMint = async () => {
        try {
            const provider = new ethers.BrowserProvider(
                walletProvider as Eip1193Provider
            )
            const signer = await provider.getSigner()
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ABI,
                signer
            )

            // Call createItem instead of getPoolItemsWithDetails
            const tx = await contract.createItem(
                nftName,
                nftImageURI,
                parseInt(poolId),
                location
            );

            // Wait for transaction to be mined
            const receipt = await tx.wait();

            // Get transaction hash
            const transactionHash = receipt.hash;
            setTxHash(transactionHash);
            setMessage(transactionHash); // Set the transaction hash as the message to write to NFC

            // Set NFT as minted to show the NFC section
            setNftMinted(true);

            alert(`Item created! Transaction hash: ${transactionHash}`);

        } catch (err) {
            console.error("Error minting:", err);
            alert("Error minting NFT. See console for details.");
        }
    }

    // Function to get NFT info from transaction hash
    const getNftInfoFromTxHash = async (hash: string) => {
        try {
            const provider = new ethers.BrowserProvider(
                walletProvider as Eip1193Provider
            )
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ABI,
                provider
            )

            // Get transaction receipt
            const receipt = await provider.getTransactionReceipt(hash);

            if (!receipt) {
                alert("Transaction not found");
                return;
            }

            // Parse the logs to find ItemCreated event
            const nftInfo = new ethers.Interface(ABI);
            const logs = receipt.logs;

            for (const log of logs) {
                try {
                    const parsedLog = nftInfo.parseLog(log);

                    // Check if this is an ItemCreated event
                    if (parsedLog && parsedLog.name === "ItemCreated") {
                        const tokenId = parsedLog.args[0]; // First argument is tokenId

                        // Get item details using tokenId
                        const itemDetails = await contract.getItemDetails(tokenId);

                        alert(`NFT ID: ${tokenId}\nName: ${itemDetails.name}\nImage: ${itemDetails.imageURI}\nPool: ${itemDetails.poolId}\nLocation: ${itemDetails.currentLocation}\nDelivered: ${itemDetails.delivered}`);
                        return;
                    }
                } catch (e) {
                    // Not our event, continue to next log
                    continue;
                }
            }

            alert("No ItemCreated event found in this transaction");

        } catch (err) {
            console.error("Error getting NFT info:", err);
            alert("Error getting NFT info. See console for details.");
        }
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-8">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">
                    NFT Minter and NFC Writer
                </h1>

                {!isNfcSupported && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-red-800 dark:text-red-200">
                            Your browser doesn&apos;t support the Web NFC API. Please use
                            Chrome on Android.
                        </p>
                    </div>
                )}

                {/* NFT Creation Form */}
                <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h2 className="font-medium mb-4">Create NFT:</h2>

                    <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium">
                            NFT Name
                        </label>
                        <input
                            type="text"
                            value={nftName}
                            onChange={(e) => setNftName(e.target.value)}
                            placeholder="T-shirt, Water bottle, etc."
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium">
                            Image URI
                        </label>
                        <input
                            type="text"
                            value={nftImageURI}
                            onChange={(e) => setNftImageURI(e.target.value)}
                            placeholder="ipfs://... or https://..."
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium">
                            Pool ID
                        </label>
                        <input
                            type="number"
                            value={poolId}
                            onChange={(e) => setPoolId(e.target.value)}
                            placeholder="0"
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium">
                            Initial Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Singapore"
                            className="w-full p-2 border rounded-lg"
                        />
                    </div>

                    <button
                        onClick={handleMint}
                        disabled={!nftName || !nftImageURI || !location}
                        className={`w-full p-3 rounded-lg font-medium ${!nftName || !nftImageURI || !location
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                    >
                        Mint NFT
                    </button>

                    {txHash && (
                        <div className="mt-3">
                            <button
                                onClick={() => getNftInfoFromTxHash(txHash)}
                                className="mt-2 text-sm text-blue-600 hover:underline"
                            >
                                View NFT Details
                            </button>
                        </div>
                    )}
                </div>

                {/* NFC Writer - Only shown after successful minting */}
                {nftMinted && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h2 className="font-medium mb-4">Write NFT to NFC Tag:</h2>
                        <p className="text-sm mb-4">
                            Your NFT has been successfully minted! Now you can write the transaction
                            hash to an NFC tag to link it with the physical item.
                        </p>

                        <button
                            onClick={handleWrite}
                            disabled={writeStatus === "writing" || !message}
                            className={`w-full p-3 rounded-lg font-medium ${writeStatus === "writing"
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                        >
                            {writeStatus === "writing"
                                ? "Tap NFC Tag..."
                                : "Write to NFC Tag"}
                        </button>

                        {writeStatus === "success" && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-green-800 dark:text-green-200">
                                    Successfully wrote to NFC tag!
                                </p>
                            </div>
                        )}

                        {writeStatus === "error" && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-red-800 dark:text-red-200">
                                    {writeErrorMessage || "Failed to write to NFC tag"}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h2 className="font-medium mb-2">Instructions:</h2>
                    <ol className="list-decimal list-inside text-sm space-y-2">
                        <li>Fill in the NFT details and click "Mint NFT"</li>
                        <li>Wait for transaction to complete</li>
                        <li>Once minting is successful, the NFC writer section will appear</li>
                        <li>Click "Write to NFC Tag" to save the transaction hash to the NFC tag</li>
                        <li>Hold your NFC tag close to the back of your device</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
