import axios from "./axios";
import { Octokit } from "octokit";
import { db } from "~/server/db";
import { aiSummariseCommit } from "./gemini";

type Response = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitAuthorAvatar: string;
  commitDate: string;
};

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});


// Will fetch all the commits related to githubUrl
const getCommitHashes = async (githubUrl: string) : Promise<Response[]> => {
  const [ owner, repo ] = githubUrl.split("/").slice(-2)
  
  if (!owner || !repo) {
    throw new Error("Invalid github url")
  }
  
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
  });

  const sortedCommits = data.sort(
    (a: any, b: any) =>
      new Date(b.commit.author?.date).getTime() -
      new Date(a.commit.author?.date).getTime(),
  ) as any[];

  return sortedCommits.slice(0,15).map((commit) => ({
    commitHash: commit.sha as string,
    commitMessage: commit.commit?.message ?? "",
    commitAuthorName: commit.commit?.author?.name ?? "",
    commitAuthorAvatar: commit?.author?.avatar_url ?? "",
    commitDate: commit?.commit?.author?.date ?? "",
  }));
};

const fetchProjectGithubUrl = async (projectId : string) => {
  const project = await db.project.findUnique({
    where : {
      id : projectId
    },
    select : {
      githubUrl : true
    }
  })

  if (!project?.githubUrl) {
    throw new Error("Project has no githubUrl")
  }

  return { project , githubUrl : project?.githubUrl}

}


// Regularly checking for new commits on a branch.
export const pollCommits = async (projectId: string) => {
  const { githubUrl, project } = await fetchProjectGithubUrl(projectId)
  const commitHashes = await getCommitHashes(githubUrl)
  const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes)
  const summaryResponses = await Promise.allSettled(unprocessedCommits.map((commit)=>{
    return summariseCommits(githubUrl, commit.commitHash)
  }))
  
  const summarises = summaryResponses.map((response) => {
    if (response.status === "fulfilled") return response.value
    return ""
  })

  const commits = await db.commit.createMany({
    data : summarises.map((summary, index) =>({
      projectId : projectId,
      commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
      commitAuthorAvatar : unprocessedCommits[index]!.commitAuthorAvatar,
      commitHash: unprocessedCommits[index]!.commitHash,
      commitMessage : unprocessedCommits[index]!.commitMessage,
      commitDate : unprocessedCommits[index]!.commitDate,
      summary    
    }))
  })

  return commits

}

const summariseCommits = async ( githubUrl : string, commitHashes :string ) => {
  const { data } = await axios.get(`${githubUrl}/commit/${commitHashes}.diff`, {
    headers : {
      Accept : "application/vnd.github.v3.diff"
    }
  })

  return await aiSummariseCommit(data) ?? ""
} 

const filterUnprocessedCommits = async (projectId : string, commitHashes : Response[]) => {
  const processedCommites = await db.commit.findMany({
    where : {
      projectId
    }
  })

  const unprocessedCommits = commitHashes.filter((commit)=> !processedCommites.some((processedCommit) => processedCommit.commitHash === commit.commitHash))

  return unprocessedCommits
}