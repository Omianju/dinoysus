"use client";

import Image from "next/image";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Info, Loader2 } from "lucide-react";
import { useRefetch } from "~/hooks/use-refetch";

interface FormInputProps {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
}

const CreatePage = () => {
  const { register, reset, handleSubmit } = useForm<FormInputProps>();
  const { mutate: createProject, isPending } =
    api.project.createProject.useMutation();

  const {data: checkCreditsData, mutate, isPending: isChecking} = api.project.checkCredits.useMutation();
  const refetch = useRefetch();
  const onSubmit = (data: FormInputProps) => {
    if (!!checkCreditsData) {
      createProject(
        {
          name: data.projectName,
          githubUrl: data.repoUrl,
          githubToken: data.githubToken,
        },
        {
          onSuccess: () => {
            toast.success("your request is send successfully");
            void refetch();
            reset();
          },
          onError: () => {
            toast.error("Something went wrong!");
          },
        },
      );
    } else {
      mutate({
        githubUrl: data.repoUrl,
        githubToken: data.githubToken ?? process.env.GITHUB_TOKEN,
      });
    }

    return true;
  };

  const hasEnoughCredits = checkCreditsData?.userCredits ? checkCreditsData.fileCount <=  checkCreditsData.userCredits : true
  return (
    <div className="flex h-full items-center justify-center gap-12">
      <Image
        src={"/undraw.svg"}
        alt="create project image"
        className="h-56 w-auto"
        height={56}
        width={60}
      />
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link Your Github Repository{" "}
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the URL of your Repository to link it to Dinoysus.
          </p>
        </div>
        <div className="h-4"></div>
        <div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("projectName", { required: true })}
              placeholder="Project Name"
              required
            />
            <div className="h-2"></div>
            <Input
              {...register("repoUrl", { required: true })}
              type="url"
              placeholder="Github URL"
              required
            />
            <div className="h-2"></div>
            <Input
              {...register("githubToken")}
              placeholder="Github Token (Optional)"
            />

            {!!checkCreditsData && (
              <>
                <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-2 text-orange-700">
                  <div className="flex items-center gap-2">
                    <Info className="size-4" />
                    <p className="text-sm">
                      You will be charged{" "}
                      <strong>{checkCreditsData?.fileCount}</strong> credits
                      for this repository.
                    </p>
                  </div>
                  <p className="ml-6 text-sm text-blue-600">
                    You have <strong>{checkCreditsData?.userCredits}</strong>{" "}
                    credits remaining.
                  </p>
                </div>
              </>
            )}

            <div className="h-4"></div>
            <Button
              type="submit"
              disabled={isPending || isChecking || !hasEnoughCredits}
            >
              {isPending || isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
              {!!checkCreditsData ? "Create Project" : "Check Credits"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
