import { React, useEffect, useState, useContext, useRef } from "react";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo.jsx";
import axios from "axios";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectUserId, setSelectUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const { username, id } = useContext(UserContext);
  const divUnderMessage = useRef();
  useEffect(() => {
    connectToWS();
  }, []);
  function connectToWS() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Trying to reconnect");
        connectToWS();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }
  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    console.log(e, { messageData });
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else {
      console.log({ messageData });
      setMessages((prev) => [...prev, { ...messageData }]);
    }
  }
  function sendMessage(ev) {
    ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectUserId,
        text: newMessageText,
      })
    );
    setNewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectUserId,
        _id: Date.now(),
      },
    ]);
  }
  // Scroll the last message into view
  useEffect(() => {
    const div = divUnderMessage.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // Get messages from DB
  useEffect(() => {
    if (selectUserId) {
      axios.get("messages/" + selectUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectUserId]);

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  const messageWithNoDuplicates = uniqBy(messages, "_id");
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <Logo />
        {Object.keys(onlinePeopleExclOurUser).map((userId) => (
          <div
            key={userId}
            onClick={() => {
              setSelectUserId(userId);
            }}
            className={
              "border-b border-gray-100 gap-2 cursor-pointer flex items-center " +
              (userId === selectUserId ? " bg-slate-100" : "")
            }
          >
            {userId === selectUserId ? (
              <div className="flex bg-blue-600 w-1 h-12 "></div>
            ) : (
              ""
            )}
            <div className="p-2 gap-2 flex pl-2 items-center">
              <Avatar
                online={true}
                username={onlinePeople[userId]}
                userId={userId}
              />
              <span className="font-semibold capitalize">
                {onlinePeople[userId]}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-blue-300 w-2/3 p-2 flex flex-col">
        <div className="flex-grow">
          {!selectUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className="uppercase font-bold text-gray-600">
                No contact selected
              </div>
            </div>
          )}
          {!!selectUserId && (
            <div className="relative h-full">
              <div className=" overflow-y-scroll absolute top-0 left-0 right-0 bottom-1">
                {messageWithNoDuplicates.map((message) => (
                  <div
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      key={messages._id}
                      className={
                        "inline-block p-2 m-2" +
                        (message.sender === id
                          ? " bg-blue-500 text-white rounded-md text-left"
                          : " bg-slate-100 rounded-md ")
                      }
                    >
                      Sender: {message.sender}
                      <br />
                      My ID: {id}
                      <br />
                      {message.text}
                    </div>
                  </div>
                ))}
                <div className="h-0.1" ref={divUnderMessage}></div>
              </div>
            </div>
          )}
        </div>

        {/* The !! converts that the value to boolean, !! for true and ! for false*/}
        {!!selectUserId && (
          <form className="flex gap-2 m-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(ev) => {
                setNewMessageText(ev.target.value);
              }}
              placeholder="Type your message here"
              className="bg-white border-blue-100 p-2 flex-grow rounded-sm"
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm"
              onSubmit={sendMessage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
