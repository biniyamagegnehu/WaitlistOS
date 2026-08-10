"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, RefreshCw, Hash, Briefcase, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { ReferralMessages as ReferralMessagesType } from "@/types/participant";
import { api } from "@/lib/axios";
import { trackFunnelEvent } from "./AnalyticsTracker";

interface ReferralMessagesProps {
  participantId: string;
  primaryColor?: string;
}

export function ReferralMessages({ participantId, primaryColor = "var(--primary)" }: ReferralMessagesProps) {
  const [messages, setMessages] = useState<ReferralMessagesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const referralSharedTracked = useRef(false);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/participants/${participantId}/referral-messages`);
      const data = res.data;
      if (data.success && data.data) {
        setMessages(data.data);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      const success = await fetchMessages();
      if (success) {
        setLoading(false);
      } else {
        // If not ready, poll every 2 seconds
        intervalId = setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [participantId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setLoading(true);
    setMessages(null);
    try {
      await api.post(`/participants/${participantId}/referral-messages/regenerate`);
      // Polling will automatically pick up the new messages since loading is true
      let pollCount = 0;
      const poll = async () => {
        const success = await fetchMessages();
        if (success || pollCount > 15) { // 30 seconds timeout
          setLoading(false);
          setRegenerating(false);
        } else {
          pollCount++;
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 2000);
    } catch (error) {
      toast.error("Failed to regenerate messages.");
      setLoading(false);
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Message copied to clipboard");

      // Track REFERRAL_SHARED funnel event (once per session)
      if (!referralSharedTracked.current) {
        referralSharedTracked.current = true;
        const sessionId = getCookie("waitlist_session");
        if (sessionId) {
          // Get waitlistId from the participant data
          // For now, we'll need to fetch participant data or pass it as prop
          // Let's add a simpler approach - track by participantId
          trackReferralSharedEvent(participantId, sessionId);
        }
      }
    });
  };

  const trackReferralSharedEvent = (participantId: string, sessionId: string) => {
    // Fetch participant to get waitlistId
    api.get(`/participants/${participantId}`)
      .then((res) => {
        if (res.data.success && res.data.data?.waitlistId) {
          trackFunnelEvent(res.data.data.waitlistId, sessionId, "REFERRAL_SHARED");
        }
      })
      .catch(() => {
        // Fail silently
      });
  };

  const getCookie = (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=")[1]) : undefined;
  };

  if (loading && !messages) {
    return (
      <Card className="mt-8 border-border/50 shadow-sm">
        <CardContent className="p-6 text-left space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Share & Move Up Faster</h3>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Preparing personalized referral messages...</p>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!messages) {
    return (
      <Card className="mt-8 border-border/50 shadow-sm">
        <CardContent className="p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Referral messages are not available yet.</p>
          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 border-border/50 shadow-sm">
      <CardContent className="p-6 text-left space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Share & Move Up Faster</h3>
            <p className="text-sm text-muted-foreground">Copy and share these personalized messages to get more referrals.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRegenerate}
            disabled={regenerating}
            className="hidden sm:flex gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`} />
            Generate New Messages
          </Button>
        </div>

        <div className="space-y-6">
          {/* Twitter / X */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Hash className="h-4 w-4 text-[#1DA1F2]" />
              Twitter / X
            </div>
            <div className="relative group">
              <div className="p-4 rounded-lg bg-surface border border-border text-sm text-muted-foreground whitespace-pre-wrap pr-12">
                {messages.twitter}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(messages.twitter)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Briefcase className="h-4 w-4 text-[#0A66C2]" />
              LinkedIn
            </div>
            <div className="relative group">
              <div className="p-4 rounded-lg bg-surface border border-border text-sm text-muted-foreground whitespace-pre-wrap pr-12">
                {messages.linkedin}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(messages.linkedin)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </div>
            <div className="relative group">
              <div className="p-4 rounded-lg bg-surface border border-border text-sm text-muted-foreground whitespace-pre-wrap pr-12">
                {messages.whatsapp}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(messages.whatsapp)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile regenerate button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full sm:hidden flex gap-2 mt-4"
        >
          <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
          Generate New Messages
        </Button>
      </CardContent>
    </Card>
  );
}
