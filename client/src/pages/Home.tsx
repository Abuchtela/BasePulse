import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { TrendingUp, Zap, BarChart3, Shield } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">BasePulse</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400">Welcome, {user?.name || "User"}</span>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => logout()}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Autonomous Trend-to-Token Engine
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            BasePulse monitors social trends on X and Farcaster, validates them against on-chain metrics, and autonomously deploys themed tokens on Base—all without human intervention.
          </p>
          {!isAuthenticated && (
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
            >
              Get Started
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
            <TrendingUp className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="font-semibold mb-2">Trend Monitoring</h3>
            <p className="text-sm text-slate-400">
              Continuously scans X and Farcaster for emerging Base ecosystem trends with LLM-powered sentiment analysis.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition">
            <BarChart3 className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="font-semibold mb-2">On-Chain Validation</h3>
            <p className="text-sm text-slate-400">
              Cross-references social trends with DexScreener metrics to validate deployment thresholds.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-pink-500 transition">
            <Zap className="w-8 h-8 text-pink-500 mb-4" />
            <h3 className="font-semibold mb-2">Autonomous Deployment</h3>
            <p className="text-sm text-slate-400">
              Deploys ERC20 tokens with Uniswap V4 liquidity pools using Clanker SDK when conditions are met.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition">
            <Shield className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-semibold mb-2">Treasury Management</h3>
            <p className="text-sm text-slate-400">
              Collects trading fees and reinvests them into Base ecosystem initiatives autonomously.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold mb-6">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, title: "Monitor", desc: "Scan social media" },
              { step: 2, title: "Analyze", desc: "Extract trends & sentiment" },
              { step: 3, title: "Validate", desc: "Check on-chain metrics" },
              { step: 4, title: "Deploy", desc: "Create token with liquidity" },
              { step: 5, title: "Reinvest", desc: "Collect fees & reinvest" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-xs text-slate-400">{item.desc}</p>
                {idx < 4 && <div className="hidden md:block absolute w-8 h-0.5 bg-slate-600 mt-6 ml-6" />}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">100%</div>
            <p className="text-slate-400">Autonomous Operations</p>
            <p className="text-xs text-slate-500 mt-2">No human intervention required</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-500 mb-2">&lt;$0.01</div>
            <p className="text-slate-400">Deployment Cost</p>
            <p className="text-xs text-slate-500 mt-2">Ultra-low Base network fees</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-pink-500 mb-2">24/7</div>
            <p className="text-slate-400">Continuous Monitoring</p>
            <p className="text-xs text-slate-500 mt-2">Always scanning for opportunities</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>BasePulse - Autonomous Trend-to-Token Engine for Base Ecosystem</p>
          <p className="mt-2">Built for the Base Build OpenClaw Agent Competition</p>
        </div>
      </footer>
    </div>
  );
}
