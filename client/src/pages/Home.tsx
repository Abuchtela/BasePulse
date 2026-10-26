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
            <Button
              onClick={() => navigate("/registry")}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800 text-emerald-400 border-emerald-800"
            >
              Registry
            </Button>
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400">
                  Welcome, {user?.name || "User"}
                </span>
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
            Evidence-First Base Agent
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            BasePulse evaluates externally sourced social evidence and
            Base-mainnet metrics. The execution loop stays disabled unless
            verified HTTPS sources and transaction credentials are explicitly
            configured.
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
              Accepts timestamped posts with public source URLs. Missing, stale,
              or malformed evidence stops the loop.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition">
            <BarChart3 className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="font-semibold mb-2">On-Chain Validation</h3>
            <p className="text-sm text-slate-400">
              Requires a fresh Base-mainnet metrics payload with its own HTTPS
              evidence URL before making a decision.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-pink-500 transition">
            <Zap className="w-8 h-8 text-pink-500 mb-4" />
            <h3 className="font-semibold mb-2">Receipt-Gated Deployment</h3>
            <p className="text-sm text-slate-400">
              Records a token only after CDP returns a successful Base
              transaction receipt and contract address. Liquidity deployment is
              not claimed.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition">
            <Shield className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-semibold mb-2">Auditable Records</h3>
            <p className="text-sm text-slate-400">
              Shows database records and public transaction evidence. Fee
              collection and reinvestment are not implemented or represented as
              complete.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold mb-6">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, title: "Fetch", desc: "Read sourced evidence" },
              { step: 2, title: "Verify", desc: "Reject stale inputs" },
              { step: 3, title: "Analyze", desc: "Link trends to sources" },
              { step: 4, title: "Validate", desc: "Apply configured limits" },
              { step: 5, title: "Confirm", desc: "Require an onchain receipt" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-xs text-slate-400">{item.desc}</p>
                {idx < 4 && (
                  <div className="hidden md:block absolute w-8 h-0.5 bg-slate-600 mt-6 ml-6" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">
              Fail Closed
            </div>
            <p className="text-slate-400">No evidence, no action</p>
            <p className="text-xs text-slate-500 mt-2">
              Generated fallback data is prohibited
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-500 mb-2">8453</div>
            <p className="text-slate-400">Required chain ID</p>
            <p className="text-xs text-slate-500 mt-2">
              Base mainnet evidence only
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-pink-500 mb-2">Onchain</div>
            <p className="text-slate-400">Receipt verification</p>
            <p className="text-xs text-slate-500 mt-2">
              Success requires a confirmed transaction
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>BasePulse - Autonomous Trend-to-Token Engine for Base Ecosystem</p>
          <p className="mt-2">
            Built for the Base Build OpenClaw Agent Competition
          </p>
        </div>
      </footer>
    </div>
  );
}
