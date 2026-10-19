import { hubStatus } from "@/lib/status";
import Composer from "./composer";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const hub = await hubStatus();
  return <Composer status={hub.channels} generator={hub.generator} />;
}
