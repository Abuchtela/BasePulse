import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Wallet, Activity } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch data
  const tokensQuery = trpc.basepulse.tokens.list.useQuery();
  const trendsQuery = trpc.basepulse.trends.recent.useQuery();
  const treasuryQuery = trpc.basepulse.treasury.balance.useQuery();
  const socialQuery = trpc.basepulse.social.interactions.useQuery();

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      tokensQuery.refetch();
      trendsQuery.refetch();
      treasuryQuery.refetch();
      socialQuery.refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, tokensQuery, trendsQuery, treasuryQuery, socialQuery]);

  const tokens = tokensQuery.data || [];
  const trends = trendsQuery.data || [];
  const treasury = treasuryQuery.data?.balance || "0";
  const interactions = socialQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">BasePulse Dashboard</h1>
          <p className="text-slate-400">Autonomous trend-to-token engine for Base ecosystem</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Tokens Deployed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tokens.length}</div>
              <p className="text-xs text-slate-500 mt-1">Active tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Treasury Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{parseFloat(treasury).toFixed(2)} ETH</div>
              <p className="text-xs text-slate-500 mt-1">Available funds</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Trends Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{trends.length}</div>
              <p className="text-xs text-slate-500 mt-1">Recent trends</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Community Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{interactions.length}</div>
              <p className="text-xs text-slate-500 mt-1">Social interactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deployed Tokens */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Deployed Tokens
                </CardTitle>
                <CardDescription>Tokens deployed by BasePulse</CardDescription>
              </CardHeader>
              <CardContent>
                {tokensQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : tokens.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No tokens deployed yet</p>
                ) : (
                  <div className="space-y-4">
                    {tokens.slice(0, 5).map((token) => (
                      <div key={token.id} className="border border-slate-700 rounded p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{token.name}</h3>
                            <p className="text-sm text-slate-400">{token.symbol}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-900 text-green-200 rounded">
                            {token.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">Trend: {token.trendTheme}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Sentiment:</span>
                            <span className="ml-1 font-semibold">{token.sentimentScore}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Market Cap:</span>
                            <span className="ml-1 font-semibold">
                              {token.currentMarketCap ? `$${parseFloat(token.currentMarketCap.toString()).toFixed(0)}` : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sentiment Meter */}
          <div>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Sentiment Meter
                </CardTitle>
                <CardDescription>Current trends</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : trends.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No trends detected</p>
                ) : (
                  <div className="space-y-4">
                    {trends.slice(0, 5).map((trend) => (
                      <div key={trend.id} className="border border-slate-700 rounded p-3">
                        <p className="font-semibold text-sm mb-2">{trend.theme}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded"
                              style={{
                                width: `${trend.sentimentScore}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold">{trend.sentimentScore}%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {trend.mentionCount} mentions • {trend.onChainVolumeUSD ? `$${parseFloat(trend.onChainVolumeUSD.toString()).toFixed(0)}` : "N/A"} volume
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Treasury Widget */}
            <Card className="bg-slate-800 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Treasury
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{parseFloat(treasury).toFixed(4)} ETH</div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">View Transactions</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle>Recent Social Activity</CardTitle>
            <CardDescription>Community interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {socialQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : interactions.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No social interactions yet</p>
            ) : (
              <div className="space-y-3">
                {interactions.slice(0, 5).map((interaction) => (
                  <div key={interaction.id} className="border border-slate-700 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs px-2 py-1 bg-slate-700 rounded">{interaction.platform}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        interaction.sentiment === "positive"
                          ? "bg-green-900 text-green-200"
                          : interaction.sentiment === "negative"
                          ? "bg-red-900 text-red-200"
                          : "bg-slate-700 text-slate-200"
                      }`}>
                        {interaction.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{interaction.postContent}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
