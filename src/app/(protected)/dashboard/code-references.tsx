"use client";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism" 

type Props = {
  fileReferences: {
    fileName: string;
    sourceCode: string;
    summary: string;
    similarity: number;
  }[];
};

const CodeReferences = ({ fileReferences }: Props) => {
  const [tab, setTab] = useState(fileReferences[0]?.fileName);
  if (fileReferences.length === 0) return null
  return (
    <div className="max-w-[70vw]">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex gap-2 overflow-scroll rounded-md bg-gray-200 p-1">
          {fileReferences.map((fileReference) => (
            <button onClick={()=> setTab(fileReference.fileName)} key={fileReference.fileName} className={cn("px-3 py-1.5 text-sm rounded-md font-medium transition-colors whitespace-nowrap", {
                'bg-primary text-primary-foreground' : tab === fileReference.fileName
            })}>
              {fileReference.fileName}
            </button>
          ))}
        </div>

        {
            fileReferences.map((fileReference) => (
                <TabsContent key={fileReference.fileName} value={fileReference.fileName} className="max-h-[40vh] max-w-7xl overflow-scroll rounded-md">
                    <SyntaxHighlighter language="typescript" style={lucario}>
                        {fileReference.sourceCode}
                    </SyntaxHighlighter>
                </TabsContent>
            ))
        }
      </Tabs>
    </div>
  );
};

export default CodeReferences;
