"use server"


import { streamText } from "ai"
import { createStreamableValue } from "ai/rsc"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateEmbedding } from "~/lib/gemini"
import { db } from "~/server/db"

const google = createGoogleGenerativeAI({
    apiKey : process.env.GEMINI_API_KEY
})

export async function askQuestion(question : string, projectId : string) {
    const stream =  createStreamableValue() // Enables progressive streaming of data in React Server Components.
    const queryVector = await generateEmbedding(question)
    const vectorQuery = `[${queryVector.join(",")}]`


    // This SQL query is using vector similarity to find and rank results in the SourceCodeEmbedding table based on their closeness to a given vector query (vectorQuery).
    // The <=> operator calculates the cosine distance between the two vectors.
    // similarity column is the column of similarity scores
    // 1 - distance: Converts the distance into a similarity score
    //     - A score closer to 1 indicates high similarity.
    //     - A score closer to 0 indicates low similarity. 

    const result = await db.$queryRaw`
    SELECT "fileName", "sourceCode", "summary",
    1 - ("summary_embeddings" <=> ${vectorQuery}::vector) AS similarity 
    FROM "source_code_embedding"
    WHERE 1 - ("summary_embeddings" <=> ${vectorQuery}::vector) > 0.5
    AND "projectId" = ${projectId}
    ORDER BY similarity DESC
    LIMIT 10
    ` as {fileName :string, sourceCode : string, summary : string, similarity : number}[]

    let context = ""

    for (const doc of result) {
        context += `source : ${doc.fileName}\n code content : ${doc.sourceCode}/n summary of file : ${doc.summary}\n\n`
    }

    (async () => {
        const { textStream } = await streamText({
            model : google("gemini-1.5-flash"),
            prompt : `
            You are an AI code assistant who answers questions about codebase. Your target audience is a technical intern who is looking to understand the codebase.

            AI assistant  is a brand new, powerful human-like artificial intelligence, the traits of ai include knowledge, cleverness, helpfulness and articulateness.

            AI is well behaved and well-mannered individual AI is always kind , helpful inspiring and he is eager to provide vivid and thoughtful responses to the user.

            AI has the sum of all the knowledge in their brain and is able to accrurately answer nearly any question about any topic in conversation.

            If the question is asking about code or specific file, AI will provide the detailed answer, giving step by step instructions, including code snippets.

            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK

            START QUESTION
            ${question}
            END OF QUESTION

            AI assistant will take into account any CONTEXT BLOCK that is provided in the conversation.

            If the context does not provide the answer to the question, AI assistant will say, "I'm sorry, I don't know the answer".

            AI assisant will not apologize for previous responses, but instead will indicated new information was gained.

            AI assistant will not invent anything that is not drawn directly from the context.

            Answer in the markdown syntax, with code snippets if needed, Be as detailed as possible when answering.
            `
        })

        for await(const delta of textStream) {
            stream.update(delta)
        }

        stream.done()
    })()
    
    return {
        output : stream.value,
        fileReferences : result
    }
}   
