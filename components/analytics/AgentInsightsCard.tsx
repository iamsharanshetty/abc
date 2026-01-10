"use client";

import { Card, CardContent } from "@/components/ui/Card";

interface AgentInsightsCardProps {
  agentName: string;
  agentRole: string;
  recentConversations: any[];
}

export function AgentInsightsCard({
  agentName,
  agentRole,
  recentConversations,
}: AgentInsightsCardProps) {
  // Analyze top questions from recent conversations
  const topQuestions = analyzeTopQuestions(recentConversations);

  // Determine role display text
  const roleDisplay =
    agentRole === "sales"
      ? "Sales Assistant"
      : agentRole === "support"
      ? "Support Assistant"
      : agentRole === "training"
      ? "Training Assistant"
      : "AI Assistant";

  return (
    <Card className="rounded-xl border border-slate-100 shadow-sm bg-white p-6 h-full dark:bg-slate-900 dark:border-slate-800">
      <CardContent className="p-0 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            {agentName}
          </h3>
          <p className="text-xs text-slate-500">{roleDisplay}</p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-4">
            Top Questions Asked
          </h4>
          {topQuestions.length > 0 ? (
            <div className="space-y-4">
              {topQuestions.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1 text-xs font-bold text-blue-900 dark:text-blue-300 min-w-[140px] truncate">
                    {item.question}
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-500 w-10 text-right">
                    ({item.count})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-8">
              No conversation data yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to analyze and group similar questions
function analyzeTopQuestions(conversations: any[]) {
  if (!conversations || conversations.length === 0) {
    return [];
  }

  // Group questions by similarity (simple word matching)
  const questionGroups: Record<string, number> = {};

  conversations.forEach((conv) => {
    if (conv.user_message) {
      // Extract first 50 chars as question preview
      const question = conv.user_message.slice(0, 50).trim();
      const lowerQuestion = question.toLowerCase();

      // Try to find similar existing question
      let matched = false;
      for (const existingQ in questionGroups) {
        if (calculateSimilarity(lowerQuestion, existingQ.toLowerCase()) > 0.6) {
          questionGroups[existingQ]++;
          matched = true;
          break;
        }
      }

      if (!matched) {
        questionGroups[question] = 1;
      }
    }
  });

  // Convert to array and sort by count
  const sortedQuestions = Object.entries(questionGroups)
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate percentages based on max count
  const maxCount = sortedQuestions[0]?.count || 1;

  return sortedQuestions.map((item) => ({
    question: item.question,
    count: item.count,
    percentage: Math.round((item.count / maxCount) * 100),
  }));
}

// Simple similarity calculation based on common words
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter((word) => words2.includes(word)).length;
  return commonWords / Math.max(words1.length, words2.length);
}
