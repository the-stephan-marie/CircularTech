import { CollectorApp } from "@/components/collector/CollectorApp";
import { CollectorAuthGuard } from "@/components/CollectorAuthGuard";

export default function CollectorPage() {
  return (
    <CollectorAuthGuard>
      <CollectorApp />
    </CollectorAuthGuard>
  );
}

