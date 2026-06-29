import { createContext, useEffect, useState, useContext } from "react";
import {io} from "socket.io-client";
import {AuthContext} from "./AuthContext";
export const SocketContext = createContext();

export const SocketContextProvider = ({children}) => {
    const {currentUser} = useContext(AuthContext);
    const [socket, setSocket] = useState(null );

    
    useEffect(() => {
        if(currentUser){
            setSocket(io("http://localhost:5000"));
        } else {
            socket?.disconnect();
            setSocket(null);
        }
    }, [currentUser]);

    useEffect(()=>{
        currentUser && socket?.emit("newUser", currentUser.id);
    },[currentUser,socket]);

    return (<SocketContext.Provider value={{ socket}}>
        {children} 
    </SocketContext.Provider>
    );
};