import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { TrendingUp, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const applySchema = z.object({
  // Section 1: Company & Product
  companyName: z.string().min(1, "Company name is required"),
  websiteUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  companyDescription: z
    .string()
    .min(1, "Description is required")
    .max(50, "Must be 50 characters or less"),
  valueProposition: z.string().min(1, "Value proposition is required"),
  onchainPart: z.string().min(1, "This field is required"),
  idealCustomer: z.string().min(1, "Ideal customer profile is required"),
  category: z.enum(["Game", "Payments", "DeFi", "Social", "Other"]),
  location: z.string().min(1, "Location is required"),
  tokenInfo: z.string().optional(),
  baseUsage: z.string().min(1, "This field is required"),

  // Section 2: Founders / Team
  foundersInfo: z.string().min(1, "Founder information is required"),
  foundersBackground: z.string().min(1, "Founder background is required"),
  introVideoUrl: z.string().min(1, "Video URL is required"),
  technicalDevelopment: z.string().min(1, "This field is required"),
  founderRelationship: z.string().min(1, "This field is required"),

  // Section 3: Progress & Traction
  progressStage: z.enum(
    ["Idea", "Prototype", "MVP", "Beta", "Launched", "Generating Revenue"],
  ),
  timeWorking: z.string().min(1, "This field is required"),
  magicPart: z.string().min(1, "This field is required"),
  uniqueInsight: z.string().min(1, "This field is required"),
  capitalPlans: z.string().min(1, "This field is required"),
  usersInfo: z.string().optional(),
  revenueInfo: z.string().optional(),
  duneAnalytics: z.string().optional(),

  // Section 4: Fit & Misc
  whyBaseBatches: z.string().min(1, "This field is required"),
  additionalInfo: z.string().optional(),

  // Section 5: Referral
  referral: z.string().optional(),

  // Section 6: Additional Important Questions
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  devfolioUsername: z.string().min(1, "Devfolio username is required"),
});

type ApplyFormValues = z.infer<typeof applySchema>;

export default function Apply() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      companyName: "",
      websiteUrl: "",
      demoUrl: "",
      companyDescription: "",
      valueProposition: "",
      onchainPart: "",
      idealCustomer: "",
      location: "",
      tokenInfo: "",
      baseUsage: "",
      foundersInfo: "",
      foundersBackground: "",
      introVideoUrl: "",
      technicalDevelopment: "",
      founderRelationship: "",
      timeWorking: "",
      magicPart: "",
      uniqueInsight: "",
      capitalPlans: "",
      usersInfo: "",
      revenueInfo: "",
      duneAnalytics: "",
      whyBaseBatches: "",
      additionalInfo: "",
      referral: "",
      firstName: "",
      lastName: "",
      email: "",
      devfolioUsername: "",
    },
  });

  function onSubmit(_data: ApplyFormValues) {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Application Submitted!</h2>
          <p className="text-slate-300 mb-8">
            Thank you for applying to Base Batches. We'll review your
            application and get back to you soon.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <span className="text-2xl font-bold">BasePulse</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Base Batches Application</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-3">Apply to Base Batches</h1>
        <p className="text-slate-400 text-lg">
          Fill out the application below. All fields marked as required must be
          completed.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {/* Section 1: Company & Product */}
            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-blue-400">
                Section 1: Company &amp; Product
              </h2>

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company Name <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your company name"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website / Product URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://yourproduct.com"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">
                      If you have one.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="demoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demo URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://demo.yourproduct.com"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">
                      Could be video, prototype, etc.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Describe what your company does{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Autonomous trend-to-token agent"
                        maxLength={50}
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">
                      In ~50 characters or less (
                      {field.value?.length ?? 0}/50)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueProposition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What is your product's unique value proposition?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your unique value proposition..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onchainPart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What part of your product is onchain?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the onchain components..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idealCustomer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What is your ideal customer profile?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your ideal customer..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Which category best describes your company?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col gap-2 mt-2"
                      >
                        {(
                          [
                            "Game",
                            "Payments",
                            "DeFi",
                            "Social",
                            "Other",
                          ] as const
                        ).map((option) => (
                          <div
                            key={option}
                            className="flex items-center gap-3"
                          >
                            <RadioGroupItem
                              value={option}
                              id={`category-${option}`}
                              className="border-slate-500"
                            />
                            <Label
                              htmlFor={`category-${option}`}
                              className="cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Where are you located now, and where would the company be
                      based after the program?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. San Francisco, CA → New York, NY"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tokenInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Do you already have a token? If so, share the Contract
                      address. What network was the token originally deployed
                      on?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contract address and network, or 'No token yet'"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What part of your product uses Base? What parts of the
                      product are exclusively Base vs other networks?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your Base usage..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Section 2: Founders / Team */}
            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-blue-400">
                Section 2: Founders / Team
              </h2>

              <FormField
                control={form.control}
                name="foundersInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Founder(s) Names &amp; Contact Information{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name, email, Twitter/Farcaster handle"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foundersBackground"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Please describe each founder's background and add their
                      LinkedIn <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Background and LinkedIn URL for each founder..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-28"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="introVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      URL of a ~1-minute unlisted video introducing the
                      founder(s) &amp; what you're building{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://youtu.be/..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technicalDevelopment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Who writes code or handles technical development? Was any
                      of this work done by non-founders?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe who handles technical development..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="founderRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How long have the founders known each other, and how did
                      you meet? <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your relationship and how you met..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Section 3: Progress & Traction */}
            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-blue-400">
                Section 3: Progress &amp; Traction
              </h2>

              <FormField
                control={form.control}
                name="progressStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How far along are you?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col gap-2 mt-2"
                      >
                        {(
                          [
                            "Idea",
                            "Prototype",
                            "MVP",
                            "Beta",
                            "Launched",
                            "Generating Revenue",
                          ] as const
                        ).map((option) => (
                          <div
                            key={option}
                            className="flex items-center gap-3"
                          >
                            <RadioGroupItem
                              value={option}
                              id={`stage-${option}`}
                              className="border-slate-500"
                            />
                            <Label
                              htmlFor={`stage-${option}`}
                              className="cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeWorking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How long have you been working on this? How much of that
                      time is full-time vs part-time?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. 6 months total, 3 months full-time..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="magicPart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What part of your product is magic or impressive?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what makes your product special..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uniqueInsight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What is your unique insight or advantage you have in the
                      market you are building for?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your unique insight or competitive advantage..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capitalPlans"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Do you plan on raising capital from VCs? Do you plan to
                      launch a token? <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your fundraising and token plans..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usersInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Do you have users or customers? If yes: how many are
                      active users/customers, how many are paying, who pays you
                      the most and how much?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your user/customer base..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revenueInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Revenue (if any): monthly/last few months/sources.
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your revenue..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duneAnalytics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Please include any Dune analytics dashboards and/or
                      public smart contract addresses you've deployed as part of
                      your project.
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Dune dashboard URLs and/or contract addresses..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Section 4: Fit & Misc */}
            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-blue-400">
                Section 4: Fit &amp; Misc
              </h2>

              <FormField
                control={form.control}
                name="whyBaseBatches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Why do you want to join Base Batches?{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us why you want to join Base Batches..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-28"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Anything else you'd like us to know?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Section 5: Referral */}
            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-blue-400">
                Section 5: Referral
              </h2>

              <FormField
                control={form.control}
                name="referral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Who referred you to this program? (Share their Social
                      Link)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://x.com/referrer or https://warpcast.com/referrer"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Section 6: Additional Important Questions */}
            <section className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-blue-400">
                Section 6: Additional Important Questions
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="First name"
                          className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Last name"
                          className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email Address{" "}
                      <span className="text-slate-400 font-normal">
                        (where the team can reach out to you)
                      </span>{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="devfolioUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Devfolio Username{" "}
                      <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your-devfolio-username"
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 px-10 text-base"
              >
                Submit Application
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>BasePulse - Autonomous Trend-to-Token Engine for Base Ecosystem</p>
        </div>
      </footer>
    </div>
  );
}
