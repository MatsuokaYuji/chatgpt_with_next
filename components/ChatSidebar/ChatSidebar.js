import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faMessage,faPlus, faRightFromBracket} from '@fortawesome/free-solid-svg-icons';

export const ChatSidebar = ({chatId}) => {
    const [chatlist,setChatlist] = useState([]);
    // 第二引数が空なのでコンポーネントがマウントされた後一度だけ実行される
    useEffect(() =>{
        const loadChatList = async () => {
            const response = await fetch(`/api/chat/getChatList`,{
                method: "POST",
            });
            const json = await response.json();
            console.log("Chat lists",json);
            // オプショナルチェイニング
            setChatlist(json?.chats || []);
        }; 
        loadChatList();
    },[chatId]);

    return (
    <div className="bg-gray-900 text-white flex flex-col overflow-hidden">
        {/* utilities classがcomponents classを上書きしてしまう */}
    <Link href= "/chat" className="side-menu-item bg-emerald-500 hover:bg-emerald-600">
    <FontAwesomeIcon icon={faPlus} />
        New chat
    </Link>
    <div className="flex-1 overflow-auto bg-gray-950">
        {chatlist.map(chat =>(
            <Link key={chat._id} href={`/chat/${chat._id}`} className={`side-menu-item ${chatId === chat._id ? "bg-gray-700 hover:bg-gray-700": ""} `}>
               <FontAwesomeIcon icon={faMessage} className="text-white/50"/> 
               <span title={chat.title} className="overflow-hidden overflow-ellipsis whitespace-nowrap">{chat.title}</span>
            </Link>
        ))}
    </div>
    <Link href= "/api/auth/logout" className="side-menu-item">
    <FontAwesomeIcon icon={faRightFromBracket} />
    Logout
    </Link>
    </div>
    )
}