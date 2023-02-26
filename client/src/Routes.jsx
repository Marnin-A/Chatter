import { useContext } from "react";
import { Register } from "./Register";
import { UserContext } from "./UserContext";

export default function Routes() {
  // Get username and id from UserContext
  const { username, id } = useContext(UserContext);

  if (username) {
    return `Welcome ${username}`;
  }
  return <Register />;
}
