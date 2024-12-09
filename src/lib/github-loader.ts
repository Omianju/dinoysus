// These will take githubUrl and return all the files in the Repository.

import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "~/server/db";


const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken ?? "",
    branch: "main",
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
    ignorePaths: [
      "package-lock.json",
      "yarn.lock",
      "bun.lockb",
      "pnpm-lock.yaml",
    ],
  });

  const docs = await loader.load();
  return docs;
};

// Document {
//     pageContent: "import {Resend} from \"resend\"\n\nconst resend = new Resend(process.env.RESEND_API_KEY)\n\nconst domain = process.env.NEXT_PUBLIC_APP_URL\n\nexport const sendTwoFactorEmail = async (\n    email : string,\n    token : string\n) => {\n    await resend.emails.send({\n        from : \"onboarding@resend.dev\",\n        to : email,\n        subject : \"2FA Code\",\n        html : `<p>Your 2FA Code : ${token}</p>`\n    })\n}\n\nexport const sendPasswordResetEmail = async (\n    email: string,\n    token: string\n) => {\n    const resetLink = `${domain}/auth/new-password?token=${token}`\n\n    await resend.emails.send({\n        from : \"onboarding@resend.dev\",\n        to: email,\n        subject: \"Reset Your Password\",\n        html: `<p>Click <a href=${resetLink}>here</a> to reset your password.</p>`\n    })\n}\n\n\nexport const sendVerificationEmail = async (\n    email : string,\n    token : string\n) => {\n
//   const confirmationLink = `${domain}/auth/new-verification?token=${token}`\n\n    await resend.emails.send({\n        from : \"onboarding@resend.dev\",\n
//      to : email,\n        subject : \"Confirmation Email\",\n        html : `<p>Click <a href=\"${confirmationLink}\">here</a> to verify your email.</p>`\n\n    })\n}",
//     metadata: {
//       source: "lib/mail.ts",
//       repository: "https://github.com/Omianju/Authentication-auth.js",
//       branch: "main",
//      }
// }

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs)
  await Promise.allSettled(allEmbeddings.map( async (embedding, index) => {
    console.log("Processiong ", index, " of ", allEmbeddings.length )
    if (!embedding) return 
    const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
      data : {
        sourceCode : embedding.sourceCode,
        summary : embedding.summary,
        fileName : embedding.fileName,
        projectId
      }
    })

    try {
      await db.$executeRaw`
      UPDATE source_code_embedding
      SET summary_embeddings = ${embedding.embedding}::vector
      WHERE id = ${sourceCodeEmbedding.id}
      `;
    } catch (error) {
      console.error("Failed to update embeddings:", error);
    }

  }))
};

const generateEmbeddings = async (docs: Document[]) => {
  return await Promise.all(
    docs.map(async (doc) => {
      const summary = await summariseCode(doc);
      const embedding = await generateEmbedding(summary);
      return {
        embedding,
        summary,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName : doc.metadata.source
      };
    }),
  );
};
