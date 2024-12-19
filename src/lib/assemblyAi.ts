




import { AssemblyAI } from "assemblyai"

const client = new AssemblyAI({
    apiKey : process.env.ASSEMBLYAI_API_KEY!
})

const msToTime = (ms:number) => {
    const seconds = ms / 1000
    const minutes = Math.floor(seconds/60)
    const remainingTime = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${remainingTime.toString().padStart(2,"0")}`
}

export const processMeeting = async (meetingUrl:string) => {
    const transcript = await client.transcripts.transcribe({
        audio : meetingUrl,
        auto_chapters : true
    })

    const summaries = transcript.chapters?.map((chapter) => ({
        start : msToTime(chapter.start),
        end : msToTime(chapter.end),
        summary : chapter.summary,
        headline : chapter.headline,
        gist : chapter.gist
    })) || []

    if (!transcript.text) throw new Error("Transcript not found!")
    
    return {summaries}


}

console.log(await processMeeting("https://assembly.ai/wildfires.mp3"))