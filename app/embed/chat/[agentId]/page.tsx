import { ChatWidget } from "@/components/chat/ChatWidget";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Chat Widget | WebRep",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmbedChatPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const supabase = await createClient();

  // Fetch agent details to customize the widget
  // If agentId is "demo", we use mock data
  let agent = null;

  if (agentId !== "demo") {
    // Try authenticated access first
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let data = null;

    if (user) {
      // User is logged in, use RLS
      const result = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();
      data = result.data;
    }

    // If no data or no user, try service client (public access)
    if (!data) {
      const serviceClient = createServiceClient();
      const result = await serviceClient
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();
      data = result.data;
    }

    agent = data;
  } else {
    // Mock agent for demo
    agent = {
      id: "demo",
      name: "Demo Agent",
      settings: {
        primaryColor: "#2563eb", // Blue
        websiteUrl: "https://example.com",
      },
    };
  }

  if (!agent && agentId !== "demo") {
    return notFound();
  }

  // Determine config
  const primaryColor = (agent?.settings as any)?.primaryColor || "#2563eb";
  const title = agent?.name || "WebRep Assistant";
  const websiteUrl = (agent?.settings as any)?.url;

  return (
    <>
      {/* ✅ THIS LINE FIXES IT */}
      <style
        dangerouslySetInnerHTML={{
          __html: `body { background: transparent !important; }`,
        }}
      />

      <div className="w-full h-screen" style={{ background: "transparent" }}>
        <ChatWidget
          agentId={agentId}
          websiteUrl={websiteUrl}
          primaryColor={primaryColor}
          title={title}
        />
      </div>
    </>
  );
}
