"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { useProject } from "~/hooks/use-project";

const InviteButton = () => {
  const { projectId } = useProject();
  const [open, setOpen] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinLink(`${window.location.origin}/join/${projectId}`);
    }
  }, [projectId]);


  return (
    
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button size={"sm"} >Invite Members</Button>
        </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">
          Ask them to copy and paste this link
        </p>
        <Input
        className="mt-2"
        readOnly
        onClick={() => {
            navigator.clipboard.writeText(joinLink || "");
            toast.success("Copied to clipboard");
          }}
        value={joinLink || ""}

        />
      </DialogContent>
    </Dialog>
  );
};

export default InviteButton;
