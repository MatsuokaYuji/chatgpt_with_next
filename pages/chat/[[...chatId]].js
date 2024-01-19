import { ChatSidebar } from "components/ChatSidebar";
import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useState } from "react";
export default function ChatPage() {
  const [incomingMessage,setIncomingMessage] = useState("");
  const [messageText,setMessageText] = useState("");

  const handleSubmit = async (e) => {
    // e はイベントオブジェクトを表します。フォームが送信されたときに、ブラウザはデフォルトの動作（通常はページの再読み込み）を行うのですが、
    // e.preventDefault() はそのデフォルトの動作をキャンセルします。このため、ページの再読み込みが防止され、フォームのカスタム処理が行えます。
    e.preventDefault();
    console.log("message",messageText);
    const response = await fetch(`/api/chat/sendMessage`,{
      method: "POST",
      headers:{
        'content-type': "application/json"
      },
      body: JSON.stringify({message:messageText}),
    });
    const data = response.body;
    if(!data){
      console.log("mistake")
      return;
    }
    const reader = data.getReader();
    await streamReader(reader,async (message) => {
      console.log("MESSAGE: ",message);
      // ????
      setIncomingMessage(s => `${s}${message.content}`);

    })
  };
  return (
    <>
      <Head>
        <title>New chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar />
        {/* 子要素を垂直に配置する指示 */}
        <div className="flex flex-col bg-gray-700">
          <div className="flex-1 text-white">
            {incomingMessage}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2">
                <textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                 placeholder="Send a message..." className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"/>
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
