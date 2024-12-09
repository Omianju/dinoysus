import { pollCommits } from "~/lib/github";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

import * as z from "zod";
import { indexGithubRepo } from "~/lib/github-loader";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          githubUrl: input.githubUrl,
          UserToProject: {
            create: {
              userId: user.userId!,
            },
          },
        },
      });
      await pollCommits(project.id);
      await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
      return project;
    }),

  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx.user;

    return await ctx.db.project.findMany({
      where: {
        UserToProject: {
          some: {
            userId: userId!,
          },
        },
        deletedAt: null,
      },
    });
  }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      pollCommits(input.projectId).then().catch(console.error)
      return await ctx.db.commit.findMany({
        where: {
          projectId: input.projectId,
        },
      });
    }),

    saveAnswer : protectedProcedure.input(z.object({
      projectId : z.string(),
      question : z.string(),
      answer : z.string(),
      fileReferences : z.any()
    })).mutation( async ({ctx, input}) => {
      return ctx.db.question.create({
        data : {
          userId : ctx.user.userId!,
          projectId : input.projectId,
          question : input.question,
          answer : input.answer,
          fileReferences : input.fileReferences
        }
      })
    })
});
