import { Chat } from "@/components/chat";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <Chat chatPath="/api/chat/police" />
    </Suspense>
  );
}
