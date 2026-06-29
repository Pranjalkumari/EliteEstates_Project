import prisma from "../lib/prisma.js" ;
import { generateOfflineOwnerReply } from "../services/ai.service.js";

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || "http://localhost:5000";

const isUserOnline = async (userId) => {
    try {
        const response = await fetch(`${SOCKET_SERVER_URL}/online/${userId}`);
        if (!response.ok) return false;
        const data = await response.json();
        return Boolean(data.online);
    } catch (err) {
        return false;
    }
};

const getPropertyContextForOwner = async (ownerId) => {
    const property = await prisma.post.findFirst({
        where: { userId: ownerId },
        orderBy: { createAt: "desc" },
        select: {
            title: true,
            city: true,
            address: true,
            price: true,
            type: true,
            property: true,
            bedroom: true,
            bathroom: true,
        },
    });

    return property || null;
};


export const addMessage = async (req,res)=>{
    const tokenUserId = req.userId;
    const chatId= req.params.chatId;
    const text = req.body.text;
    try{
        const chat = await prisma.chat.findUnique({
            where:{
                id:chatId,
                userIDs:{
                    hasSome:[tokenUserId],
                }
            }
        });
        if(!chat)return res.status(404).json({message:"Chat not found"});
        const userMessage = await prisma.message.create({
            data:{
                text,
                chatId,
                userId:tokenUserId,
            }
        });

        await prisma.chat.update({
            where:{
                id:chatId,
            },
            data:{
                seenBy:{
                    push:[tokenUserId],
                },
                lastMessage:text,
            }
        });

        const receiverId = chat.userIDs.find((id) => id !== tokenUserId);
        let aiMessage = null;

        if (receiverId) {
            const ownerOnline = await isUserOnline(receiverId);

            if (!ownerOnline) {
                const propertyContext = await getPropertyContextForOwner(receiverId);
                const aiReplyText = await generateOfflineOwnerReply({
                    userMessage: text,
                    propertyContext,
                });

                aiMessage = await prisma.message.create({
                    data: {
                        text: aiReplyText,
                        chatId,
                        // Store AI message under owner id so it appears as owner-side reply in UI.
                        userId: receiverId,
                    },
                });

                await prisma.chat.update({
                    where: { id: chatId },
                    data: {
                        lastMessage: aiReplyText,
                    },
                });
            }
        }

        res.status(200).json({ userMessage, aiMessage });
    }catch(err){
        console.log(err);
        res.status(500).json({message:"Failed to add message!"})
    }
};


