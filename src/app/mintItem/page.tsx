"use client";

import { 
    // useAppKitAccount, 
    useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider } from "ethers";
import { ethers } from "ethers";
import { useState, useRef } from "react";
import { CONTRACT_ADDRESS } from "@/utils/config";
import ABI from "../../contract/abi.json"

// Add this interface for GeolocationPosition
interface GeolocationPositionExtended {
    coords: {
        latitude: number;
        longitude: number;
        accuracy: number;
        altitude: number | null;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
    };
    timestamp: number;
}

export default function Home() {
    // const { address, isConnected } = useAppKitAccount();
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

    // Add loading state for location fetch
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Function to get user's country
    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            // First get coordinates using browser's Geolocation API with proper typing
            const position = await new Promise<GeolocationPositionExtended>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve(pos as GeolocationPositionExtended),
                    reject,
                    { enableHighAccuracy: true }
                );
            });

            const { latitude, longitude } = position.coords;

            // Use reverse geocoding to get country name
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}&language=en`
            );

            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const country = data.results[0].components.country;
                setLocation(country);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            alert('Unable to get your location. Please enter it manually.');
        } finally {
            setIsLoadingLocation(false);
        }
    };

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
                    console.log(e)
                    continue;
                }
            }

            alert("No ItemCreated event found in this transaction");

        } catch (err) {
            console.error("Error getting NFT info:", err);
            alert("Error getting NFT info. See console for details.");
        }
    }

    // Image handling functions
    const handleImageButton = () => {
        setShowImageOptions(!showImageOptions);
    };
    
    const handleFileSelect = () => {
        fileInputRef.current?.click();
        setShowImageOptions(false);
    };
    
    const handleCameraCapture = () => {
        cameraInputRef.current?.click();
        setShowImageOptions(false);
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setImageFile(file);
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
        
        // Here you would normally upload the file to IPFS or your storage service
        // For now, just setting a placeholder URL
        // In a real implementation, you'd upload the file and get a URI back
        try {
            setIsUploading(true);
            // Mock upload - replace with actual upload code
            // Example: const uri = await uploadToIPFS(file);
            // For demo, we'll use the local preview
            setTimeout(() => {
                setNftImageURI(preview);
                setIsUploading(false);
            }, 1000);
        } catch (error) {
            console.error("Error uploading image:", error);
            setIsUploading(false);
        }
    };
    
    // Function to upload to IPFS (placeholder)
    // In a real implementation, you would connect to IPFS or your preferred storage
    // For example using NFT.Storage, Pinata, or other services
    /*
    const uploadToIPFS = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('your-upload-endpoint', {
            method: 'POST',
            body: formData,
        });
        
        const data = await response.json();
        return data.ipfsUri; // or whatever format your service returns
    };
    */

    return (
        <div className="flex flex-col items-center min-h-screen ">
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-600">
                    Mint Items
                </h1>

                {!isNfcSupported && (
                    <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                        <p className="text-red-400">
                            Your browser doesn&apos;t support the Web NFC API. Please use
                            Chrome on Android.
                        </p>
                    </div>
                )}

                {/* NFT Creation Form */}
                <div className="mb-8 p-6 bg-[#0c252a] border border-[#d9ff56]/20 rounded-xl shadow-xl">
                    <h2 className="text-xl font-semibold mb-6 text-white">
                        Create NFT
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-white">
                                NFT Name
                            </label>
                            <input
                                type="text"
                                value={nftName}
                                onChange={(e) => setNftName(e.target.value)}
                                placeholder="T-shirt, Water bottle, etc."
                                className="w-full p-3 bg-white/10 border border-[#d9ff56]/20 rounded-lg focus:ring-2 focus:ring-[#d9ff56] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-white">
                                Image
                            </label>
                            <div className="space-y-3">
                                {imagePreview && (
                                    <div className="relative w-full h-40 rounded-lg overflow-hidden">
                                        <img 
                                            src={imagePreview} 
                                            alt="NFT preview" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                
                                <div className="relative">
                                    <button
                                        onClick={handleImageButton}
                                        className="w-full p-3 rounded-lg font-medium transition-all duration-200 bg-white/10 border border-[#d9ff56]/20 text-white hover:bg-white/20"
                                        disabled={isUploading}
                                    >
                                        {isUploading 
                                            ? "Uploading..." 
                                            : imagePreview 
                                                ? "Change Image" 
                                                : "Select Image"}
                                    </button>
                                    
                                    {showImageOptions && (
                                        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#0c252a] border border-[#d9ff56]/20 rounded-lg z-10">
                                            <button
                                                onClick={handleFileSelect}
                                                className="w-full p-2 mb-2 rounded-lg font-medium transition-all duration-200 bg-white/10 text-white hover:bg-white/20"
                                            >
                                                Select from Files
                                            </button>
                                            <button
                                                onClick={handleCameraCapture}
                                                className="w-full p-2 rounded-lg font-medium transition-all duration-200 bg-white/10 text-white hover:bg-white/20"
                                            >
                                                Take a Picture
                                            </button>
                                        </div>
                                    )}
                                    
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    
                                    <input 
                                        type="file"
                                        ref={cameraInputRef}
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                                
                                {/* Hidden URI input that gets updated when an image is selected */}
                                <input
                                    type="hidden"
                                    value={nftImageURI}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-white">
                                Pool ID
                            </label>
                            <input
                                type="number"
                                value={poolId}
                                onChange={(e) => setPoolId(e.target.value)}
                                placeholder="0"
                                className="w-full p-3 bg-white/10 border border-[#d9ff56]/20 rounded-lg focus:ring-2 focus:ring-[#d9ff56] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-white">
                                Initial Location
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Singapore"
                                    className="flex-1 p-3 bg-white/10 border border-[#d9ff56]/20 rounded-lg focus:ring-2 focus:ring-[#d9ff56] focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                                />
                                <button
                                    onClick={getCurrentLocation}
                                    disabled={isLoadingLocation}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isLoadingLocation
                                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                        : "bg-[#d9ff56] text-[#0c252a] hover:bg-opacity-90"
                                        }`}
                                >
                                    {isLoadingLocation ? "Loading..." : "📍"}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleMint}
                            disabled={!nftName || !nftImageURI || !location}
                            className={`w-full p-3 rounded-lg font-medium transition-all duration-200 ${!nftName || !nftImageURI || !location
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-[#d9ff56] text-[#0c252a] hover:bg-opacity-90"
                                }`}
                        >
                            Mint NFT
                        </button>

                        {txHash && (
                            <div className="mt-3">
                                <button
                                    onClick={() => getNftInfoFromTxHash(txHash)}
                                    className="text-sm text-[#d9ff56] hover:text-[#d9ff56]/80 transition-colors duration-200"
                                >
                                    View NFT Details
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* NFC Writer Section */}
                {nftMinted && (
                    <div className="mb-6 p-6 bg-[#0c252a] border border-[#d9ff56]/20 rounded-xl">
                        <h2 className="text-xl font-semibold mb-4 text-white">
                            Write NFT to NFC Tag
                        </h2>
                        <p className="text-sm mb-4 text-gray-300">
                            Your NFT has been successfully minted! Now you can write the transaction
                            hash to an NFC tag to link it with the physical item.
                        </p>

                        <button
                            onClick={handleWrite}
                            disabled={writeStatus === "writing" || !message}
                            className={`w-full p-3 rounded-lg font-medium transition-all duration-200 ${writeStatus === "writing"
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-[#d9ff56] text-[#0c252a] hover:bg-opacity-90"
                                }`}
                        >
                            {writeStatus === "writing" ? "Tap NFC Tag..." : "Write to NFC Tag"}
                        </button>

                        {writeStatus === "success" && (
                            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <p className="text-green-400">
                                    Successfully wrote to NFC tag! ✨
                                </p>
                            </div>
                        )}

                        {writeStatus === "error" && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400">
                                    {writeErrorMessage || "Failed to write to NFC tag"}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions Section */}
                <div className="mt-6 p-6 bg-[#0c252a] border border-[#d9ff56]/20 rounded-xl">
                    <h2 className="text-xl font-semibold mb-4 text-white">
                        Instructions
                    </h2>
                    <ol className="list-decimal list-inside text-sm space-y-2 text-gray-300">
                        <li>Fill in the NFT details and click &quot;Mint NFT&quot;</li>
                        <li>Wait for transaction to complete</li>
                        <li>Once minting is successful, the NFC writer section will appear</li>
                        <li>Click &quot;Write to NFC Tag&quot; to save the transaction hash to the NFC tag</li>
                        <li>Hold your NFC tag close to the back of your device</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
