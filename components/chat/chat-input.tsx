import { useChatActions, useChatStatus } from "@ai-sdk-tools/store";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { useRef, useState } from "react";

export function ChatInput() {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const status = useChatStatus();
  const { sendMessage } = useChatActions();

  function handleSubmit(message: PromptInputMessage) {
    const text = message.text ?? "";

    if (!Boolean(text)) {
      return;
    }

    sendMessage({
      text,
    });
    setInput("");
  }

  return (
    <PromptInput
      onSubmit={handleSubmit}
      className="bg-background/80 backdrop-blur-xl rounded-md border border-border shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
    >
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="ถามคำถามของคุณ"
          ref={inputRef}
          autoFocus
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit disabled={(!input && !status) || status === "submitted"} status={status} />
      </PromptInputFooter>
    </PromptInput>
  );
}
