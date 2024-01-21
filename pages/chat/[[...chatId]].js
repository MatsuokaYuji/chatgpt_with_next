import { ChatSidebar } from "components/ChatSidebar";
import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useEffect, useState } from "react";
import {v4 as uuid} from 'uuid';
import { Message } from "components/Message";
import { useRouter } from "next/router";


export default function ChatPage() {
  const [newChatId,setNewChatId] = useState(null);
  const [incomingMessage,setIncomingMessage] = useState("");
  const [messageText,setMessageText] = useState("");
  const [newChatMessages,setNewChatMessages] = useState([]);
  const [generatingResponse,setGeneratingResponse] = useState(false);
  const router = useRouter();

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
      body: JSON.stringify({message:messageText}),
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
    await streamReader(reader,async (message) => {
      console.log("MESSAGE: ",message);
      if(message.event === "newChatId") {
        setNewChatId(message.content);
      }else{
        // バックティックを使った文字列結合。元のものにmessage.contentを追加している
        setIncomingMessage(s => `${s}${message.content}`);
      }
    });
    
    setGeneratingResponse(false);
  };
  return (
    <>
      <Head>
        <title>New chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar />
        {/* 子要素を垂直に配置する指示 */}
        {/* overflow-hidden overflow-scrollで最下部に固定*/}
        <div className="flex flex-col bg-gray-700 overflow-hidden">
          <div className="flex-1 text-white overflow-scroll">
            {newChatMessages.map(message =>(
              <Message key={message._id} role={message.role} content={message.content}/>
            ))}
            {/* && (...): この部分は論理AND演算子です。JavaScriptでは、A && Bの形式で、Aが真（truthy）の場合にのみBを評価し、Bの結果を返します。 */}
            {!!incomingMessage && (
            <Message role="assistant" content={incomingMessage}/>
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
