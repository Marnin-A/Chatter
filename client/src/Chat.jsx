import { React, useEffect, useState, useContext, useRef } from "react";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo.jsx";
import axios from "axios";
import Contact from "./Contact";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectUserId, setSelectUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [offlinePeople, setOfflinePeople] = useState({});
  const { username, id, setId, setUsername } = useContext(UserContext);
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
      }, 5000);
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
      if (messageData.sender === selectUserId) {
        setMessages((prev) => [...prev, { ...messageData }]);
      }
    }
  }
  function logout() {
    axios.post("/logout").then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }
  function sendMessage(ev, file = null) {
    if (ev) ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectUserId,
        text: newMessageText,
        file,
      })
    );

    if (file) {
      // Get the messages if there is a file
      axios.get("messages/" + selectUserId).then((res) => {
        setMessages(res.data);
      });
    } else {
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
  }
  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, { name: ev.target.files[0].name, data: reader.result });
    };
  }
  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

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
      <div className="bg-white w-1/3 flex flex-col flex-grow ">
        <div className="flex-grow">
          <Logo />
          {/* Display online contacts */}
          {Object.keys(onlinePeopleExclOurUser).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => setSelectUserId(userId)}
              selected={userId === selectUserId}
            />
          ))}
          {/* Display offline contacts */}
          {Object.keys(offlinePeople).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId].username}
              onClick={() => setSelectUserId(userId)}
              selected={userId === selectUserId}
            />
          ))}
        </div>
        <div className="p-2 text-center">
          <span> The USER</span>
          <button
            onClick={logout}
            className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-md hover:bg-red-300 hover:text-black"
          >
            Logout
          </button>
        </div>
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
                    key={messages._id}
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
                      {message.text}
                      {message.file && (
                        <div>
                          <a
                            target="_blank"
                            className="underline flex items-center gap-1"
                            href={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-5 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                color="white"
                                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                              />
                            </svg>
                            {message.file}
                          </a>
                        </div>
                      )}
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
            <label
              onChange={sendFile}
              className="bg-gray-400 rounded-sm p-1 pt-2 cursor-pointer"
            >
              <input type="file" className="hidden" />
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
                  color="white"
                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                />
              </svg>
            </label>
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
