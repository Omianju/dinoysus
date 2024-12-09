"use client";

import Image from "next/image";
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  const refetch = useRefetch();
  const onSubmit = (data: FormInputProps) => {
    createProject(
      {
        name: data.projectName,
        githubUrl: data.repoUrl,
        githubToken: data.githubToken,
      },
      {
        onSuccess: (data) => {
          toast.success("your request is send successfully");
          refetch();
          reset();
        },
        onError: () => {
          toast.error("Something went wrong!");
        },
      },
    );
    return true;
  };
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
            <div className="h-4"></div>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
