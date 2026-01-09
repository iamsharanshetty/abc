import TeamPageClient from "@/components/team/TeamPageClient";
import { getProfile } from "@/lib/actions/agents";

export default async function TeamPage() {
    const profile = await getProfile();

    return <TeamPageClient profile={profile} />;
}
