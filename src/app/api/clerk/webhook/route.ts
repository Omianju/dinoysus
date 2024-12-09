import { db } from "~/server/db";

export const POST = async (req: Request) => {
  try {
    const SIGNING_SECRET = process.env.SIGNING_SECRET;

    if (!SIGNING_SECRET) {
      throw new Error("Error: Invalid SignIn Secret");
    }
    const { data } = await req.json();

    await db.user.create({
      data: {
        id: data.id,
        emailAddress: data.email_addresses[0].email_address,
        imageUrl: data.image_url,
        firstName: data.first_name,
        lastName: data.last_name,
      },
    });

    return new Response( "user created successfully", {status : 200} )
  } catch (error: any) {
    console.log(error);
    return new Response( "Something went wrong", {status : 400} )
  }
};
