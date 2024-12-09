import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";
import { Octokit } from "octokit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let requestCounter = 0;
const REQUEST_LIMIT = 60;
const COOLDOWN_PERIOD = 66000; // 1.1 minutes in milliseconds

export const aiSummariseCommit = async (diff: string) => {
  const response = await model.generateContent([
    `
        You are an expert programmer and you are trying to summarize a git diff.
        Reminders about git diff format:
        for every line, there are a few metadata lines, like (for example):
        \`\`\`
        diff --git a/lib/index.js b/lib/index.js
        index aadf691..bfef603 100644
        --- a/lib/index.js
        +++ b/lib/index.js
        \`\`\`
        This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
        then there is a specifier of the lines that were , modified.
        A line starting with \`+\` means it was added.
        A line that starting with \`-\` means that that line was deleted.
        A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
        It is not part of the diff.
    [...]
    EXAMPLE SUMMARY COMMENTS:
    \`\`\`
    * Raised the amount of returned recordings from \`100\` [packages/server/recordings_api.ts]. [packages/server/constants.ts]
    * Fixed a typo in the github action name [.github/workflow/gpt-commit-summarizer.yml]
    * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
    * Added on OpenAI API for completions [packages/utils/apis/openai.ts]
    * Lowered numeric tolerance for test files
    \`\`\`
    Most commits will have less comments than this example list.
    The last comment does not include the file names,
    because there were more than two relevant files in the hypothetical commit.
    Do not include parts of the example in your summary.
    It is given only as an example of appropriate comments. `,
    `Please summarise the following diff file \n\n ${diff}`,
  ]);

  return response.response.text();
};

export const summariseCode = async (doc: Document) => {
  console.log("getting summary for ", doc.metadata.source);
  try {
    // Check if we've hit the request limit
    // if (requestCounter >= REQUEST_LIMIT) {
    //   console.log("Rate limit reached, waiting for cooldown...");
    //   await new Promise(resolve => setTimeout(resolve, COOLDOWN_PERIOD));
    //   requestCounter = 0; // Reset counter after cooldown
    // }

    const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
    const response = await model.generateContent([
      `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
      `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
    Here is the code:
    ---
    ${code}
    ---
    Give a summary no more than 100 words of the code above
    `,
    ]);

    // requestCounter++; // Increment counter after successful request
    return response.response.text();
  } catch (error) {
    console.log(error)
    return "";
  }
};

export const generateEmbedding = async (summary: string) => {
  const model = genAI.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await model.embedContent(summary);

  return result.embedding.values;
};
