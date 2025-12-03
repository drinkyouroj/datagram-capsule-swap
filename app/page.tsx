'use client';

import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import { Loader2, Search, Wallet, ArrowRight, Copy, Check, AlertTriangle } from 'lucide-react';
import capsuleValuesData from '../data/capsule_values.json';
import { CAPSULE_SWAP_ABI } from '@/lib/abis';
import { useWriteContract } from 'wagmi';

const capsuleValues = capsuleValuesData as Record<string, string>;

const CAPSULE_CONTRACT = '0xC9Af289cd84864876b5337E3ef092B205f47d65F';
const SWAP_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const TREASURY_ADDRESS = '0x0de730684c2a11d4c1eb08f8676fc9f1b822220e';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<{ value: string, payout: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: contractBalance } = useBalance({
    address: SWAP_CONTRACT,
  });

  const handleLookup = () => {
    if (!lookupId) return;
    const valStr = capsuleValues[lookupId];
    if (valStr) {
      const total = parseEther(valStr);
      const payout = (total * 25n) / 100n;
      setLookupResult({
        value: valStr,
        payout: formatEther(payout)
      });
    } else {
      setLookupResult(null);
      alert('Capsule ID not found');
    }
  };

  const copyTreasury = () => {
    navigator.clipboard.writeText(TREASURY_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLiquiditySufficient = lookupResult && contractBalance 
    ? contractBalance.value >= parseEther(lookupResult.payout)
    : true;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg animate-pulse" />
            <span className="font-bold text-xl tracking-tight">Capsule Swap</span>
          </div>
          
          {isConnected ? (
            <div className="flex gap-4 items-center">
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-400">Connected</p>
                <p className="font-mono text-sm">{address?.slice(0,6)}...{address?.slice(-4)}</p>
              </div>
              <button 
                onClick={() => disconnect()}
                className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm font-medium"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={() => connect({ connector: injected() })}
              className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-16 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Unlock Your Liquidity
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Instantly swap your Datagram Capsules for 25% of their value in liquid DGRAM tokens. No waiting, no hassle.
          </p>

          {/* Lookup Tool */}
          <div className="max-w-md mx-auto bg-white/5 border border-white/10 p-2 rounded-2xl flex gap-2 backdrop-blur-lg shadow-2xl shadow-blue-900/20">
            <input 
              type="text" 
              placeholder="Enter Capsule ID (e.g. 3135137970)" 
              className="bg-transparent border-none outline-none flex-1 px-4 text-lg placeholder:text-gray-600"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            />
            <button 
              onClick={handleLookup}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Check Value
            </button>
          </div>
        </div>
      </div>

      {/* Results / Options Section */}
      {lookupResult && (
        <div className="max-w-4xl mx-auto px-6 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {!isLiquiditySufficient && (
            <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3 text-yellow-500">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                The contract currently has insufficient liquidity for this swap. Please try again later or contact support.
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-8 border-b border-white/10 bg-white/5 text-center">
              <h2 className="text-2xl font-bold mb-2">Capsule #{lookupId}</h2>
              <div className="flex justify-center items-center gap-8 mt-6">
                <div className="text-center">
                  <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Total Value</p>
                  <p className="text-3xl font-mono text-gray-300">{lookupResult.value} DGRAM</p>
                </div>
                <ArrowRight className="text-gray-600" />
                <div className="text-center">
                  <p className="text-green-500 uppercase text-xs font-bold tracking-wider mb-1">You Receive (25%)</p>
                  <p className="text-4xl font-mono font-bold text-green-400">{lookupResult.payout} DGRAM</p>
                </div>
              </div>
            </div>

            {/* Options Grid */}
            <div className={`grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 ${!isLiquiditySufficient ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              
              {/* Option 1: Web Swap */}
              <div className="p-8 flex flex-col h-full">
                <div className="mb-6">
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">1</div>
                  <h3 className="text-xl font-bold mb-2">Swap via Website</h3>
                  <p className="text-gray-400 text-sm">Connect your wallet and swap instantly with one click.</p>
                </div>
                <div className="mt-auto">
                  {isConnected ? (
                    <CapsuleCard capsule={{ id: lookupId, value: lookupResult.value, payout: lookupResult.payout }} swapper={SWAP_CONTRACT} disabled={!isLiquiditySufficient} />
                  ) : (
                    <button 
                      onClick={() => connect({ connector: injected() })}
                      disabled={!isLiquiditySufficient}
                      className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                      Connect Wallet to Swap
                    </button>
                  )}
                </div>
              </div>

              {/* Option 2: Direct Transfer */}
              <div className="p-8 flex flex-col h-full bg-white/[0.02]">
                <div className="mb-6">
                  <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4">2</div>
                  <h3 className="text-xl font-bold mb-2">Manual Transfer</h3>
                  <p className="text-gray-400 text-sm">Send the NFT directly from your Datagram Dashboard. Our bot will detect it and pay you automatically.</p>
                </div>
                
                <div className="mt-auto bg-black/50 p-4 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Send Capsule To:</p>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="flex-1 text-sm text-purple-300 truncate">{TREASURY_ADDRESS}</code>
                    <button onClick={copyTreasury} disabled={!isLiquiditySufficient} className="text-gray-400 hover:text-white">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    ⚠️ Only send Datagram Capsules. Other NFTs will be lost.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="max-w-6xl mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-2xl font-bold mb-8">Recent Activity</h2>
        <ActivityFeed />
      </div>
    </main>
  );
}

function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setActivities(data);
      })
      .catch(console.error);
  }, []);

  if (activities.length === 0) return <div className="text-gray-500 italic">No recent activity found.</div>;

  return (
    <div className="grid gap-4">
      {activities.map((act, i) => (
        <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-white/10 transition">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 font-bold">
              $
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-white">Capsule #{act.token_id}</span>
                <span className="text-xs text-gray-500">swapped by</span>
                <span className="font-mono text-xs text-blue-400">{act.user_address.slice(0,6)}...{act.user_address.slice(-4)}</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(act.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-green-400 font-mono font-bold">+ {formatEther(BigInt(act.amount || 0))} DGRAM</span>
            <a 
              href={`https://explorer.datagram.network/tx/${act.nonce}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-gray-600 hover:text-gray-400 underline"
            >
              View on Explorer
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function CapsuleCard({ capsule, swapper, disabled }: { capsule: { id: string, value: string, payout: string }, swapper: `0x${string}`, disabled?: boolean }) {
  const { writeContract, isPending } = useWriteContract();
  const { address } = useAccount();

  const handleSwap = async () => {
    if (!address || disabled) return;
    
    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        body: JSON.stringify({ tokenId: capsule.id, userAddress: address }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      writeContract({
        abi: CAPSULE_SWAP_ABI,
        address: swapper,
        functionName: 'swap',
        args: [
          BigInt(capsule.id),
          BigInt(data.amount),
          BigInt(data.nonce),
          BigInt(data.deadline),
          data.signature
        ],
      });
      
    } catch (err) {
      console.error(err);
      alert('Swap failed: ' + (err as Error).message);
    }
  };

  return (
    <button 
      onClick={handleSwap}
      disabled={isPending || disabled}
      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20"
    >
      {isPending ? <Loader2 className="animate-spin w-5 h-5" /> : 'Swap Now'}
    </button>
  );
}
