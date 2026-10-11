import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  LockKeyhole,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";

const themeOptions = [
  { value: "broad-market", label: "Broad market" },
  { value: "technology", label: "Technology" },
  { value: "ai", label: "AI" },
  { value: "consumer", label: "Consumer" },
  { value: "income", label: "Income" },
] as const;

type Theme = (typeof themeOptions)[number]["value"];
type Risk = "conservative" | "balanced" | "growth";

export default function PulseIndex() {
  const [, navigate] = useLocation();
  const [objective, setObjective] = useState(
    "Build a diversified technology and AI portfolio for long-term growth while limiting concentration."
  );
  const [budgetUsd, setBudgetUsd] = useState(1_000);
  const [riskLevel, setRiskLevel] = useState<Risk>("balanced");
  const [themes, setThemes] = useState<Theme[]>(["technology", "ai"]);
  const [exclusions, setExclusions] = useState("weapons, fossil fuels");
  const [maxPositionPercent, setMaxPositionPercent] = useState(25);
  const [countryCode, setCountryCode] = useState("US");
  const planMutation = trpc.basepulse.pulseindex.plan.useMutation();

  const toggleTheme = (theme: Theme) => {
    setThemes(current =>
      current.includes(theme)
        ? current.filter(value => value !== theme)
        : [...current, theme]
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    planMutation.mutate({
      objective,
      budgetUsd,
      riskLevel,
      themes,
      exclusions: exclusions
        .split(",")
        .map(value => value.trim())
        .filter(Boolean),
      maxPositionPercent,
      countryCode,
    });
  };

  const plan = planMutation.data;

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-cyan-950 bg-[#081522]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            BasePulse
          </button>
          <div className="flex items-center gap-2">
            <Badge className="border border-cyan-800 bg-cyan-950 text-cyan-300">
              Agent 02
            </Badge>
            <Badge
              variant="outline"
              className="border-amber-800 text-amber-300"
            >
              Simulation
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/30">
              <Bot className="h-6 w-6" />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
              PulseIndex Agent
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Turn a plain-language mandate into an onchain-ready portfolio
              plan.
            </h1>
          </div>
          <p className="text-sm leading-6 text-slate-400">
            This Base Sepolia prototype creates transparent simulated
            allocations, applies policy limits, and never submits a trade. Live
            eligibility must be verified by a regulated provider.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-slate-800 bg-slate-950/60 text-white shadow-2xl shadow-cyan-950/20">
            <CardHeader>
              <CardTitle>Portfolio mandate</CardTitle>
              <CardDescription className="text-slate-400">
                Set the rules the agent must follow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="objective">What do you want?</Label>
                  <Textarea
                    id="objective"
                    value={objective}
                    onChange={event => setObjective(event.target.value)}
                    className="min-h-24 border-slate-700 bg-slate-900 text-white"
                    maxLength={500}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Demo budget (USD)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min={10}
                      max={1_000_000}
                      value={budgetUsd}
                      onChange={event =>
                        setBudgetUsd(Number(event.target.value))
                      }
                      className="border-slate-700 bg-slate-900 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country code</Label>
                    <Input
                      id="country"
                      value={countryCode}
                      onChange={event =>
                        setCountryCode(
                          event.target.value.toUpperCase().slice(0, 2)
                        )
                      }
                      className="border-slate-700 bg-slate-900 uppercase text-white"
                      placeholder="US"
                      minLength={2}
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Risk profile</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(["conservative", "balanced", "growth"] as Risk[]).map(
                      risk => (
                        <button
                          key={risk}
                          type="button"
                          onClick={() => setRiskLevel(risk)}
                          className={`rounded-lg border px-2 py-2 text-xs capitalize transition ${
                            riskLevel === risk
                              ? "border-cyan-500 bg-cyan-500/10 text-cyan-200"
                              : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {risk}
                        </button>
                      )
                    )}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Themes</legend>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions.map(theme => (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => toggleTheme(theme.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          themes.includes(theme.value)
                            ? "border-violet-500 bg-violet-500/10 text-violet-200"
                            : "border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <Label htmlFor="exclusions">
                    Exclusions, separated by commas
                  </Label>
                  <Input
                    id="exclusions"
                    value={exclusions}
                    onChange={event => setExclusions(event.target.value)}
                    className="border-slate-700 bg-slate-900 text-white"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <Label>Maximum per position</Label>
                    <span className="font-mono text-cyan-300">
                      {maxPositionPercent}%
                    </span>
                  </div>
                  <Slider
                    min={10}
                    max={50}
                    step={5}
                    value={[maxPositionPercent]}
                    onValueChange={value => setMaxPositionPercent(value[0])}
                  />
                </div>

                <Button
                  className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  size="lg"
                  type="submit"
                  disabled={planMutation.isPending}
                >
                  {planMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PieChart className="mr-2 h-4 w-4" />
                  )}
                  Generate simulated plan
                </Button>

                {planMutation.error && (
                  <p className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
                    {planMutation.error.message}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {!plan ? (
              <Card className="flex min-h-[520px] items-center justify-center border-dashed border-slate-700 bg-slate-950/30 text-white">
                <CardContent className="max-w-sm py-16 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-slate-500">
                    <CircleDollarSign className="h-8 w-8" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold">
                    Your plan will appear here
                  </h2>
                  <p className="text-sm leading-6 text-slate-500">
                    The agent will show every allocation, explanation, and
                    safety decision before any future wallet action.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-cyan-950 bg-slate-950/60 text-white">
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle>Proposed allocation</CardTitle>
                      <CardDescription className="mt-1 text-slate-400">
                        {plan.id} · Base Sepolia simulation
                      </CardDescription>
                    </div>
                    <Badge className="bg-amber-950 text-amber-300">
                      No trade submitted
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.holdings.map(holding => (
                      <div
                        key={holding.symbol}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-cyan-300">
                                {holding.symbol}
                              </span>
                              <span className="text-sm text-slate-300">
                                {holding.name}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {holding.rationale}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {holding.weightPercent}%
                            </div>
                            <div className="text-xs text-slate-400">
                              ${holding.amountUsd.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                            style={{ width: `${holding.weightPercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-800 pt-4 text-sm">
                      <span className="text-slate-400">Simulated total</span>
                      <span className="font-semibold">
                        ${plan.totalUsd.toLocaleString()} · {plan.totalPercent}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-950/60 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />{" "}
                      Policy checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.policyChecks.map(check => (
                      <div
                        key={check.label}
                        className="flex gap-3 rounded-lg bg-slate-900 p-3"
                      >
                        {check.status === "pass" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        ) : check.status === "blocked" ? (
                          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{check.label}</p>
                          <p className="mt-0.5 text-xs leading-5 text-slate-500">
                            {check.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
