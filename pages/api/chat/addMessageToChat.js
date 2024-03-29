import { getSession } from "@auth0/nextjs-auth0";
// デフォルトエクスポート vs 名前付きエクスポートではまった
import  clientPromise  from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res){
    try {
        const {user} = await getSession(req,res);
        const client = await clientPromise;
        const db = client.db("ChattyPete");
        const {chatId,role,content} = req.body;
        // stringからObjectIdへの変換が必要
        const chat = await db.collection("chats").findOneAndUpdate({
            _id: new ObjectId(chatId),
            userId: user.sub,

        },{
            $push:{
                messages:{
                    role,
                    content,
                }
            }
        },{
            returnDocument: "after" 
        });
        console.log("updateされたchatだよ",chat);
        res.status(200).json({
            chat:{
                ...chat.value,
                _id:chat.value._id.toString(),

            }
        })
    }catch(e){
        res.status(500).json({message:"An error occurred when adding a message to a chat"})
        console.log("addingmessage中にERROR発生です。",e)
    }
}