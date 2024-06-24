import { getSession } from "@auth0/nextjs-auth0";
import { ChatSidebar } from "components/ChatSidebar";
import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useEffect, useState } from "react";
import {v4 as uuid} from 'uuid';
import { Message } from "components/Message";
import { useRouter } from "next/router";
import  clientPromise  from "lib/mongodb";
import { ObjectId } from "mongodb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faRobot} from '@fortawesome/free-solid-svg-icons';


export default function ChatPage({ chatId,title,messages = [] }) {
  console.log("props",title,messages);
  const [newChatId,setNewChatId] = useState(null);
  const [incomingMessage,setIncomingMessage] = useState("");
  const [messageText,setMessageText] = useState("");
  const [newChatMessages,setNewChatMessages] = useState([]);
  const [generatingResponse,setGeneratingResponse] = useState(false);
  const [fullMessage,setFullMessage] = useState("");
  const [originalChatId,setOriginalChatId] = useState(chatId);
  const router = useRouter();

  const routeHasChanged = chatId !== originalChatId;


  // chatIdが変更されるたび(つまりrouteが変わるたびに)にstateをリセットする
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);

  },[chatId])

  // save the newly streamed message to new chat messages
  useEffect(() => {
    if(!routeHasChanged && !generatingResponse && fullMessage){
      setNewChatMessages(prev => [...prev,{
        _id: uuid(),
        role:"assistant",
        content:fullMessage
      }])
      setFullMessage("");
    }
  },[generatingResponse,fullMessage,routeHasChanged])

  // newChatId,generatingResponseが更新されるたびに動く
  // streamが終わると生成されたnewChatIdのページに遷移。
  useEffect(() => {
    if(!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }

  },[newChatId,generatingResponse,router])

  const handleSubmit = async (e) => {
    // e はイベントオブジェクトを表します。フォームが送信されたときに、ブラウザはデフォルトの動作（通常はページの再読み込み）を行うのですが、
    // e.preventDefault() はそのデフォルトの動作をキャンセルします。このため、ページの再読み込みが防止され、フォームのカスタム処理が行えます。
    e.preventDefault();
    setGeneratingResponse(true);
    setOriginalChatId(chatId);
    // userがチャットで送った内容を画面上に表示する。roleはユーザー送信のメッセージなのか、gptからの返信なのかを識別して背景色を変えることなどに使える。
    // ...prevの部分では、JavaScriptのスプレッド構文が使用されています。
    // スプレッド構文は、配列やオブジェクトの要素を個々に展開するために使用されます。このコンテキストでは、prev（現在のnewChatMessagesステートの値）の各要素を新しい配列の中に個別に展開しています。
    setNewChatMessages(prev =>{
      const newChatMessages = [
        ...prev,
        {
        _id: uuid(),
        role:"user",
        content:messageText
        },
      ];
      return newChatMessages;
    });
    setMessageText("");
     const response = await fetch(`/api/chat/sendMessage`,{
      method: "POST",
      headers:{
        'content-type': "application/json"
      },
      body: JSON.stringify({chatId,message:messageText}),
    });
    // response.dataではないので注意
    const data = response.body;
    if(!data){
      console.log("mistake")
      return;
    }
    // streamReaderよく分かってないので調べる
    // リアルタイムでデータ（この場合はサーバーからの返信）を受け取り、それをブラウザに表示するための非同期処理を行うこと
    // 各データチャンクが到着するたびに、非同期コールバック関数（ここではasync (message) => { ... }）が実行されます。
    // これにより、データが到着するとすぐに処理が行われ、ユーザーインターフェースにリアルタイムで表示されるようになります。
    const reader = data.getReader();
    let content = "";
    await streamReader(reader,async (message) => {
      console.log("MESSAGE: ",message);
      if(message.event === "newChatId") {
        setNewChatId(message.content);
      }else{
        // バックティックを使った文字列結合。元のものにmessage.contentを追加している
        setIncomingMessage(s => `${s}${message.content}`);
        content = content + message.content;
      }
    });
    setFullMessage(content);
    setIncomingMessage("");
    setGeneratingResponse(false);
  };

  const allMessages = [...messages, ...newChatMessages];

  return (
    <>
      <Head>
        <title>New chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar chatId={chatId}/>
        {/* 子要素を垂直に配置する指示 */}
        {/* overflow-hidden overflow-scrollで最下部に固定*/}
        <div className="flex flex-col bg-gray-700 overflow-hidden">
          {/* flex flex-col-reverseを追加した上でdivtag、className="mb-auto　で囲むとstreamが自動でスクロールされて、かつ最初のメッセージは一番上にくる */}
          <div className="flex-1 text-white overflow-scroll flex flex-col-reverse">
            {!allMessages.length && !incomingMessage &&
            <div className="m-auto justify-center flex items-center text-center">
              <div>
              <FontAwesomeIcon icon={faRobot} className="text-6xl text-emerald-200"/>
              <h1 className="text-4xl font-bold text-white/50 mt-2">Ask me a question!</h1>
              </div>
            </div>
            }
            {!!allMessages.length && (
            <div className="mb-auto">
            {allMessages.map(message =>(
              <Message key={message._id} role={message.role} content={message.content}/>
            ))}
            {/* && (...): この部分は論理AND演算子です。JavaScriptでは、A && Bの形式で、Aが真（truthy）の場合にのみBを評価し、Bの結果を返します。 */}
            {!!incomingMessage && !routeHasChanged && (
            <Message role="assistant" content={incomingMessage}/>
            )}
            {!!incomingMessage && routeHasChanged && (
            <Message role="notice" content="Only one message at a time. Please allow any other responses to complete before sending another message"/>
            )}
            </div>
          )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={generatingResponse}>
                <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                 placeholder={generatingResponse ? "":"Send a message..." } className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"/>
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
            </footer>
        </div>

      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  // console.log("ctxの中身",ctx);
  const chatId = ctx.params?.chatId?.[0] || null;
  if(chatId){
    // chatidがmondbのobjectidであるかをチェック
    let objectId;
    try{
      objectId = new ObjectId(chatId);
    }catch(e){
      return {
        redirect:{
          destination:"/chat"
        }
      }
    }

    const {user} = await getSession(ctx.req,ctx.res);
    const client = await clientPromise;
    const db = client.db("ChattyPete");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id:new ObjectId(chatId),
  });
  if(!chat){
    return {
      redirect:{
        destination:"/chat"
      }
    }
  }
    return {
      props:{
        chatId,
        title: chat.title,
        messages:chat.messages.map(message =>({
          ...message,
          _id:uuid(),
        }))
      },
    };
  }
  return {
    props:{}
  }

  
}