import { useState, useEffect, useRef } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useHMSActions, 
  useHMSStore, 
  selectHMSMessages
} from "@100mslive/react-sdk";

interface ChatProps {
  onClose: () => void;
}

const Chat = ({ onClose }: ChatProps) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hmsActions = useHMSActions();
  const messages = useHMSStore(selectHMSMessages);
  
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      hmsActions.sendBroadcastMessage(message.trim());
      setMessage("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun message pour le moment
          </p>
        ) : (
          messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              sender={msg.senderName} 
              text={msg.message}
              time={new Date(msg.time).toLocaleTimeString()}
              isFromMe={msg.sender === msg.senderUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrivez un message..."
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button type="submit" disabled={!message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

interface MessageItemProps {
  sender: string;
  text: string;
  time: string;
  isFromMe: boolean;
}

const MessageItem = ({ sender, text, time, isFromMe }: MessageItemProps) => (
  <div className={`flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}>
    <div className={`px-4 py-2 rounded-lg max-w-[80%] ${
      isFromMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
    }`}>
      {!isFromMe && <p className="font-semibold text-xs">{sender}</p>}
      <p>{text}</p>
    </div>
    <span className="text-xs text-gray-500 mt-1">{time}</span>
  </div>
);

export default Chat;
