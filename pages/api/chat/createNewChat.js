import { getSession } from "@auth0/nextjs-auth0";
// デフォルトエクスポート vs 名前付きエクスポートではまった
import  clientPromise  from "lib/mongodb";

export default async function handler(req, res){
    try {
        const {user} = await getSession(req,res)
        const {message} = req.body;


        // varidation
        if(!message || typeof message !== "string" || message.length > 400){
            res.status(422).json({
                message: "message is required and must be less than 400 characters",
            });
            return;
        }

        const newUserMessage = {
            role:"user",
            content:message,
        };
        const client = await clientPromise;
        const db = client.db("ChattyPete");
        const chat = await db.collection("chats").insertOne({
            userId: user.sub,
            messages: [newUserMessage],
            title: message,
        });
        res.status(200).json({
            _id: chat.insertedId.toString(),
            messages:[newUserMessage],
            title:message
        })
    }catch(e){
        res.status(500).json({message:"An error occurred when creating a new chat"})
        console.log("chat作成時にERROR発生です。",e)
    }
}