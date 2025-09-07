 import prisma from "../lib/prisma.js";
import Jwt from "jsonwebtoken";
import { promisify } from "util";
import { ObjectId } from "mongodb";



 export const getPosts = async(req, res) =>{
    const query = req.query;
    
     try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });

    //  setTimeout(()=>{
    //     res.status(200).json(posts)
    //  }, 2000);

     res.status(200).json(posts)
        
    } catch (err) {
        console.log(err)
         res.status(500).json({message:"failed to get  posts"}) 
    }
 }



//  export const getPost = async (req, res) => {
//   const id = req.params.id;
//   try {
//     const post = await prisma.post.findUnique({
//       where: { id },
//       include: {
//         postDetail: true,
//         user: {
//           select: {
//             username: true,
//             avatar: true,
//           },
//         },
//       },
//     });

//     const token = req.cookies?.token;

//     if (token) {
//       jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
//         if (!err) {
//           const saved = await prisma.savedPost.findUnique({
//             where: {
//               userId_postId: {
//                 postId: id,
//                 userId: payload.id,
//               },
//             },
//           });
//           res.status(200).json({ ...post, isSaved: saved ? true : false });
//         }
//       });
//     }
//     res.status(200).json({ ...post, isSaved: false });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Failed to get post" });
//   }
// };




const verifyToken = promisify(Jwt.verify);

export const getPost = async (req, res) => {
  const id = req.params.id;

  // Check if ID is a valid ObjectId
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Post ID" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    let userId = null;
    const token = req.cookies?.token;

    if (token) {
      try {
        const payload = await verifyToken(token, process.env.JWT_SECRET_KEY);
        userId = payload.id;
      } catch (err) {
        // token invalid or expired — optional logging
        console.log("Invalid token");
      }
    }

    let saved = null;
    if (userId) {
      saved = await prisma.savedPost.findUnique({
        where: {
          userId_postId: {
            postId: id,
            userId,
          },
        },
      });
    }

    return res.status(200).json({
      ...post,
      isSaved: !!saved,
    });

  } catch (err) {
    console.log("Error:", err);
    return res.status(500).json({ message: "Failed to get post" });
  }
};



 export const addPost = async(req, res) =>{
    const body = req.body;
    const tokenUserId = req.userId;
    try {
        const newPost = await prisma.post.create({
            data:{
                ...body.postData,
                 userId: tokenUserId,
                 postDetail:{
                     create:body.postDetail,
                 },
            },
        });
        res.status(200).json(newPost)
    } catch (err) {
        console.log(err)
         res.status(500).json({message:"failed to create post"}) 
    }
 }





 export const updatePost = async(req, res) =>{
    try {
        res.status(200).json()
    } catch (err) {
        console.log(err)
         res.status(500).json({message:"failed to update post"}) 
    }
 }






 export const deletePost = async(req, res) =>{
    const id = req.params.id;
    const tokenUserId = req.userId
    try {
        const post = await prisma.post.findUnique({
            where:{id}
        });

        if(post.userId !== tokenUserId){
            return res.status(403).json({message:"Not Autherized!"})
        }

        await prisma.post.delete({
            where:{id},
        });
        res.status(200).json({message:"Post deleted"});
    } catch (err) {
        console.log(err)
         res.status(500).json({message:"failed to delete a post"}) 
    }
 }