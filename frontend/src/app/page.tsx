'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:75px_75px] [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-100/[0.04]"></div>
        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
              Intelligent Video Analysis
              <br />
              Powered by AI
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Transform your video feeds into actionable insights with advanced deep learning technology.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500"
                onClick={() => router.push('/login')}
              >
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Powered by Advanced AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 backdrop-blur-sm bg-background/95">
              <h3 className="text-xl font-semibold mb-3">Deep Learning Detection</h3>
              <p className="text-muted-foreground">Advanced object recognition and tracking powered by state-of-the-art neural networks.</p>
            </Card>
            <Card className="p-6 backdrop-blur-sm bg-background/95">
              <h3 className="text-xl font-semibold mb-3">Real-time Analysis</h3>
              <p className="text-muted-foreground">Instant processing and alerts for your video feeds, ensuring you never miss critical events.</p>
            </Card>
            <Card className="p-6 backdrop-blur-sm bg-background/95">
              <h3 className="text-xl font-semibold mb-3">Smart Notifications</h3>
              <p className="text-muted-foreground">Intelligent alert system that knows what matters to you, reducing false positives.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-semibold text-blue-500">1</span>
              </div>
              <h3 className="text-xl font-semibold">Connect Camera</h3>
              <p className="text-muted-foreground">Add your IP cameras or upload video files for analysis</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-semibold text-teal-500">2</span>
              </div>
              <h3 className="text-xl font-semibold">AI Analysis</h3>
              <p className="text-muted-foreground">Our deep learning models analyze your feeds in real-time</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-semibold text-purple-500">3</span>
              </div>
              <h3 className="text-xl font-semibold">Get Notified</h3>
              <p className="text-muted-foreground">Receive instant alerts when important events are detected</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">Transform your video monitoring with the power of AI</p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500"
            onClick={() => router.push('/login')}
          >
            Start Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
