"use client";

import Image from "next/image";
import React, { FormEvent, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { askQuestion } from "./actions";
import { useProject } from "~/hooks/use-project";
import { readStreamableValue } from "ai/rsc";
import MDEditor from "@uiw/react-md-editor";
import { Loader2 } from "lucide-react";
import CodeReferences from "./code-references";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [fileReferences, setFileReferences] = useState<
    {
      fileName: string;
      sourceCode: string;
      summary: string;
      similarity: number;
    }[]
  >([]);

  const { mutate: saveAnswer, isPending } =
    api.project.saveAnswer.useMutation();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAnswer("");
    setFileReferences([]);
    if (!project?.id) return;
    setIsLoading(true);

    const { output, fileReferences } = await askQuestion(question, project?.id);
    setOpen(true);
    setFileReferences(fileReferences);

    for await (const delta of readStreamableValue(output)) {
      setAnswer((ans) => ans + delta);
    }

    setIsLoading(false);
    setQuestion("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[80vw]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              <Image src={"/logo3.png"} alt="logo" width={40} height={40} />
            </DialogTitle>
            <Button
              variant={"ghost"}
              disabled={isPending}
              onClick={() =>
                saveAnswer(
                  {
                    projectId: project?.id!,
                    question,
                    answer,
                    fileReferences,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Answer Saved");
                    },
                    onError: () => {
                      toast.error("Failed to save the answer!");
                    },
                  },
                )
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Answer"
              )}
            </Button>
          </div>
        </DialogHeader>

        <MDEditor.Markdown
          source={answer}
          className="!h-full max-h-[40vh] max-w-[70vw] overflow-scroll"
        />
        <div className="h-4"></div>
        <CodeReferences fileReferences={fileReferences} />
        <Button onClick={() => setOpen(false)}>Close</Button>
      </DialogContent>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should I edit to change the home page."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Ask Dinoysus
            </Button>
          </form>
        </CardContent>
      </Card>
    </Dialog>
  );
};

export default AskQuestionCard;
