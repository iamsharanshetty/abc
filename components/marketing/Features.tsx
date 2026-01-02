"use client";

import {
  Brain,
  Zap,
  Compass,
  MousePointerClick,
  MessageCircleQuestion,
  Fingerprint,
  Code,
  BarChart3,
  Infinity,
  Sparkles,
} from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { MouseEvent } from "react";

interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
  tagline: string;
  color: string;
  className: string;
}

function FeatureCard({
  feature,
  className,
}: {
  feature: Feature;
  className?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      className={`group relative border border-border bg-card overflow-hidden rounded-3xl p-8 ${className}`}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(59, 130, 246, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full flex flex-col">
        <div
          className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mb-6 shadow-inner`}
        >
          <div className="text-white">{feature.icon}</div>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-3 leading-tight tracking-tight">
          {feature.title}
        </h3>

        <p className="text-muted-foreground leading-relaxed flex-grow">
          {feature.description}
        </p>

        <div className="mt-6 pt-6 border-t border-border/50 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
          <Sparkles className="w-4 h-4" />
          {feature.tagline}
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  const features: Feature[] = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Semantic Context Engine",
      description:
        "Analyzes your entire site to understand product details, pricing, and brand voice with near-human comprehension.",
      tagline: "Deep Learning",
      color: "bg-blue-600",
      className: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "40ms Response Time",
      description:
        "Lightning-fast answers that keep users engaged and prevent bounce rates.",
      tagline: "Real-time",
      color: "bg-amber-500",
      className: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: <Compass className="w-6 h-6" />,
      title: "Smart Navigation",
      description:
        "Directs users to specific pages based on their intent, increasing page-per-visit metrics.",
      tagline: "Contextual Routing",
      color: "bg-emerald-500",
      className: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: <MousePointerClick className="w-6 h-6" />,
      title: "Conversion Actions",
      description:
        "Can book meetings, collect emails, or process basic orders directly inside the chat interface.",
      tagline: "Revenue Driver",
      color: "bg-purple-600",
      className: "md:col-span-2 lg:col-span-2",
    },
    {
      icon: <MessageCircleQuestion className="w-6 h-6" />,
      title: "Objection Handling",
      description:
        "Justifies value, differentiates offerings, and resolves hesitation confidently in real-time.",
      tagline: "Closing Logic",
      color: "bg-rose-500",
      className: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: <Fingerprint className="w-6 h-6" />,
      title: "Brand Tone Matching",
      description:
        "Learns your specific writing style to ensure every interaction feels like your team.",
      tagline: "Brand Safe",
      color: "bg-indigo-500",
      className: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "1-Click Deployment",
      description:
        "Works with any platform. Just paste one line of code and you are live.",
      tagline: "Universal",
      color: "bg-slate-500",
      className: "md:col-span-2 lg:col-span-2",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Conversational Analytics",
      description:
        "Uncover what your visitors are actually asking and identify gaps in your content.",
      tagline: "Actionable Data",
      color: "bg-cyan-500",
      className: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: <Infinity className="w-6 h-6" />,
      title: "Infinite Scale",
      description:
        "Handles thousands of simultaneous visitors without any degradation in quality.",
      tagline: "Always On",
      color: "bg-pink-500",
      className: "md:col-span-2 lg:col-span-3",
    },
  ];

  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Capabilities
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            More Than Just a Chatbot. <br />A Complete{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              Revenue Engine
            </span>
            .
          </h3>
          <p className="text-xl text-muted-foreground">
            WebRep doesn&apos;t just answer questions. It understands intent,
            handles objections, and closes deals 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard
              key={idx}
              feature={feature}
              className={feature.className}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
