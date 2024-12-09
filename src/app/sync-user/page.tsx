import { auth } from "@clerk/nextjs/server";

const SyncUserPage = async () => {
    const { userId } = await auth()
    console.log(userId)
    return <div>SyncUser</div>
};

export default SyncUserPage;
