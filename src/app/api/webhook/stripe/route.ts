import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "~/server/db";




const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion : "2024-11-20.acacia"
})




export async function POST(req: NextRequest, res : NextResponse ) {
    const body = await req.text()
    const signature = (await headers()).get("Stripe-Signature") as string
    let event : Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (error) {
        return NextResponse.json({error : "Invalid Signature"}, {status : 400})
    }

    const session = event.data.object as Stripe.Checkout.Session

    console.log(event.type)

    if (event.type === "checkout.session.completed") {
        const credits = Number(session.metadata?.["credits"])
        const userId = session.client_reference_id

        if (!credits || !userId) {
            return NextResponse.json({error : "Missing userId or credits"}, {status : 400})
        }

        await db.stripeTransaction.create({data: {userId, credits}})

        await db.user.update({
            where: {
                id : userId
            },
            data : {
                credits : {
                    increment : credits
                }
            }
        })


        return NextResponse.json({success : "Credits added Successfully"}, {status : 200})
    }

    return NextResponse.json({message : "Process complete"}, {status :200})
}