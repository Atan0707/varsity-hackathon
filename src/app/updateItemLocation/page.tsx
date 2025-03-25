"use client";

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Eip1193Provider } from "ethers";
import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { CONTRACT_ADDRESS } from "@/utils/config";
import ABI from "../../contract/abi.json";
import Link from "next/link";

export default function PoolsPage() {
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");
    const [pools, setPools] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isConnected && walletProvider) {
            fetchPools();
        }
    }, [isConnected, walletProvider]);

    const fetchPools = async () => {
        try {
            setLoading(true);
            setError(null);

            const provider = new ethers.BrowserProvider(
                walletProvider as Eip1193Provider
            )
            const signer = await provider.getSigner()
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ABI,
                signer
            )

            const poolsData = await contract.getAllPools();
            const formattedPools = poolsData[0].map((id: number, index: number) => ({
                id: Number(id),
                name: poolsData[1][index]
            }));

            setPools(formattedPools);
        } catch (error) {
            console.error("Error fetching pools:", error);
            setError("Failed to fetch pools. Please make sure your wallet is connected.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-8 bg-[rgb(256,252,228)]">
            <div className="w-full max-w-7xl">
                <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 text-[#0c252a]">
                    Available Donation Pools
                </h1>

                {!isConnected && (
                    <div className="p-4 mb-4 bg-[#d9ff56]/10 text-[#0c252a] rounded-lg border border-[#d9ff56]/20">
                        Please connect your wallet to view pools.
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-4 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center p-4 text-[#0c252a]">
                        <div className="animate-spin h-8 w-8 border-4 border-[#d9ff56] border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading pools...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pools.length === 0 ? (
                            <div className="text-center p-4 bg-white rounded-lg shadow-md text-[#0c252a]">
                                No pools available.
                            </div>
                        ) : (
                            pools.map((pool) => (
                                <Link
                                    href={`/updateItemLocation/${pool.id}`}
                                    key={pool.id}
                                    className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all"
                                >
                                    <div className="h-48 bg-gray-300 relative">
                                        <img
                                            src={`https://placehold.co/400x200/e9e9dc/0c252a?text=${encodeURIComponent(pool.name)}`}
                                            alt={pool.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-[#0c252a] mb-2">
                                            {pool.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Pool ID: {pool.id}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}