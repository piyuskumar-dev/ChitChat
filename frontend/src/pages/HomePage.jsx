import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser, selectedGroup } = useChatStore();

  return (
    <div className="h-screen bg-base-200 pt-16">
      <div className="flex h-full bg-base-100 shadow-cl w-full overflow-hidden">
        <Sidebar />

        {(!selectedUser && !selectedGroup) ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
  );
};
export default HomePage;
