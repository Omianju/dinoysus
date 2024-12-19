"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Presentation, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useProject } from "~/hooks/use-project";
import { useUploadThing } from "~/lib/uploadthing";
import { api } from "~/trpc/react";
import axios from "~/lib/axios"

const MeetingCard = () => {
  const router = useRouter()
  const {projectId} = useProject()
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { startUpload, isUploading : inProgress } = useUploadThing("audioUploader")
  const { mutate : uploadMeeting } = api.project.uploadMeeting.useMutation()
  const processMeeting = useMutation({mutationFn : async (data : {meetingUrl : string, meetingId : string}) => {
    const {meetingUrl, meetingId} = data
    const { data: meetingData } = await axios.post(`/api/process-meeting`, { meetingUrl, meetingId })
    return meetingData
  }})
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a"],
    },
    multiple: false,
    maxSize: 50_000_000,
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);      
      const name = acceptedFiles[0]?.name
      const res = await startUpload(acceptedFiles)

      if (!res) {
        return toast.error("Upload Failed try again later!")
      } 
      
      const audiofile = res[0]
      
      if (audiofile?.name && audiofile?.url) {
        uploadMeeting({
          projectId,
          name : audiofile?.name,
          meetingUrl: audiofile?.url
        }, {
          onSuccess : (meeting) => {
            toast.success("Meeting Successfully uploaded")
            router.push("/meetings")
            processMeeting.mutateAsync({meetingUrl: meeting.downloadUrl, meetingId : meeting.id})
          },
          onError : () => {
            toast.error("Upload Failed try again later!")
          }
        })
      }

      setIsUploading(false);
    },
  });

  
  return (
    <Card
      className="col-span-3 mt-4 flex flex-col items-center justify-center p-10 sm:mt-0"
      {...getRootProps()}
    >
      {!isUploading && (
        <>
          <Presentation className="h-10 w-10 animate-bounce" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Create a new Meeting
          </h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            Analyse your meetings with Dinoysus
            <br />
            Powered by AI
          </p>
          <div className="mt-6">
            <Button disabled={isUploading}>
              <Upload className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden />
              Upload Meeting
              <input className="hidden" {...getInputProps()} />
            </Button>
          </div>
        </>
      )}

      {inProgress && (
        <div className="flex flex-col gap-4 items-center justify-center">
          <Loader2 className="size-14 animate-spin"/>

          <p className="text-center text-sm text-gray-500">
            Uploading your meeting...
          </p>
        </div>
      )}
    </Card>
  );
};

export default MeetingCard;
