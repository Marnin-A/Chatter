import { React, useEffect, useState, useContext } from "react";
import { UserContext } from "./UserContext";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo.jsx";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectUserId, setSelectUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const { username, id } = useContext(UserContext);
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
  }, []);

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }
  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    }
  }
  function sendMessage(ev) {
    ev.preventDefault();
    console.log("sending");
    ws.send(
      JSON.stringify({
        message: {
          recipient: selectUserId,
          text: newMessageText,
        },
      })
    );
  }

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];
  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <Logo />
        {Object.keys(onlinePeopleExclOurUser).map((userId) => (
          <div
            key={userId}
            onClick={() => {
              setSelectUserId(userId);
              console.log(selectUserId);
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
              <Avatar username={onlinePeople[userId]} userId={userId} />
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
