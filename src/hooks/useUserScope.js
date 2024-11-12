import { useContext } from "react";
import { UserContext } from "../context/user-context";

const useUserScope = () => {
    const { user } = useContext(UserContext);
    return user.scope;
}

export default useUserScope;