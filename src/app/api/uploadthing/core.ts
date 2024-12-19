import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  audioUploader: f(
    {
      "audio/mpeg": {
        maxFileSize: "16MB",
        maxFileCount: 1,
      },
    }
  )
    .middleware(async ({ req }) => {
      try {
        const { userId } = await auth();
        if (!userId) throw new UploadThingError("Unauthorized");
        return { userId: userId };
      } catch (error) {
        console.error("Authentication error:", error);
        throw new UploadThingError("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
