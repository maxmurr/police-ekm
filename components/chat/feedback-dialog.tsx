"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ISSUE_TYPES = [
  "Incorrect information",
  "Incomplete answer",
  "Irrelevant response",
  "Poor formatting",
  "Other",
] as const;

interface FeedbackDialogProps {
  traceId: string | undefined;
}

export function FeedbackDialog({ traceId }: FeedbackDialogProps) {
  const [submitted, setSubmitted] = useState<"positive" | "negative" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (value: 0 | 1, opts?: { issueType?: string; comment?: string }) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traceId,
          value,
          issueType: opts?.issueType,
          comment: opts?.comment,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      toast.success("Feedback submitted");
    } catch {
      toast.error("Failed to submit feedback");
      setSubmitted(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleThumbsUp = () => {
    if (submitted) return;
    setSubmitted("positive");
    submitFeedback(1);
  };

  const handleThumbsDown = () => {
    if (submitted) return;
    setSubmitted("negative");
    setDialogOpen(true);
  };

  const handleNegativeSubmit = () => {
    submitFeedback(0, { issueType, comment });
    setDialogOpen(false);
    setIssueType("");
    setComment("");
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && submitted === "negative" && !submitting) {
      submitFeedback(0);
    }
    setDialogOpen(open);
  };

  const disabled = !traceId || submitted !== null;

  return (
    <>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleThumbsUp}
              disabled={disabled}
              className="cursor-pointer rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              aria-label="Good response"
            >
              <ThumbsUp className={`size-3 ${submitted === "positive" ? "fill-current text-foreground" : ""}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Good response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleThumbsDown}
              disabled={disabled}
              className="cursor-pointer rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              aria-label="Bad response"
            >
              <ThumbsDown className={`size-3 ${submitted === "negative" ? "fill-current text-foreground" : ""}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Bad response</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What went wrong?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue type</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an issue" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional comments</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more about the issue..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleNegativeSubmit} disabled={submitting}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
