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

        let objectId;
        try{
          objectId = new ObjectId(chatId);
        }catch(e){
            res.status(422).json({
                message:"Invarid chatId"
            });
            return;
        }

        // varidate content data
        if(!content || typeof content !== "string" || (role==="user" && content.length > 400) || (role==="assistant" && content.length > 100000)){
            res.status(422).json({
                message: "content is required and must be less than 400 characters",
            });
            return;
        }

        // varidate role
        if(role !== "user" && role !== "assistant"){
            res.status(422).json({
                message: "role must be either assistant or user",
            });
            return;
        }

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