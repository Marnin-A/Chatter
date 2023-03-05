import Avatar from "./Avatar";
export default function Contact({ id, username, onClick, selected, online }) {
  return (
    <div
      key={id}
      onClick={() => {
        onClick(id);
      }}
      className={
        "hover:bg-slate-100 border-b border-gray-100 gap-2 cursor-pointer flex items-center " +
        (selected ? " bg-slate-100" : "")
      }
    >
      {selected ? <div className="flex bg-blue-600 w-1 h-12 "></div> : ""}
      <div className="p-2 gap-2 flex pl-2 items-center">
        <Avatar online={online} username={username} userId={id} />
        <span className="font-semibold capitalize">{username}</span>
      </div>
    </div>
  );
}
