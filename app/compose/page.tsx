import { channelStatus, generatorStatus } from "@/lib/status";
import Composer from "./composer";

export const dynamic = "force-dynamic";

export default function ComposePage() {
  return <Composer status={channelStatus()} generator={generatorStatus()} />;
}
