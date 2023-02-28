import { useState, useContext } from "react";
import { UserContext } from "./UserContext";
import axios from "axios";

export const RegisterAndLoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedInOrRegistered, setIsLoggedInOrRegistered] =
    useState("register");
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault(); // Ensures the data is sent to the correct route
    // Send user data to the register route
    const url = isLoggedInOrRegistered === "register" ? "register" : "login";
    const { data } = await axios.post(url, { username, password });
    setLoggedInUsername(username);
    setId(data.id);
  }
  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form onSubmit={handleSubmit} action="" className="w-64 mx-auto mb-12">
        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          className="block w-full rounded-sm p-2 mb-2 border"
          name=""
          id=""
        />
        <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
          {isLoggedInOrRegistered === "register" ? "Register" : "Login"}
        </button>
        <div className="text-centre mt-2">
          {isLoggedInOrRegistered === "register" && (
            <div>
              Already have a Member?{" "}
              <button
                onClick={() => {
                  setIsLoggedInOrRegistered("login");
                }}
                href=""
              >
                Login here
              </button>
            </div>
          )}
          {isLoggedInOrRegistered === "login" && (
            <div>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setIsLoggedInOrRegistered("register");
                }}
                href=""
              >
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
