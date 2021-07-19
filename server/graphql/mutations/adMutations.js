const adType = require("../types/adType");
const adModel = require("../../models/ad");
const GraphQLNonNull = require("graphql").GraphQLNonNull;
const GraphQLString = require("graphql").GraphQLString;
const checkAuth = require("../../utils/check-auth");
const GraphQLID = require("graphql").GraphQLID;

module.exports = {
  createAd: {
    type: adType.adType,
    args: {
      title: {
        type: new GraphQLNonNull(GraphQLString),
      },
      body: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve: async (root, args, context) => {
      // console.log(root, "root ");
      // console.log(context, "context ");
      const user = checkAuth(context);
      console.log(user, "user");
      const { title, body, username } = args;

      // const uModel = new adModel(args);
      const uModel = new adModel({
        title,
        body,
        username: user.username,
        user: user.id,
        createdAt: new Date().toISOString(),
      });

      const newAd = await uModel.save();
      if (!newAd) {
        throw new Error("error");
      }
      return newAd;
    },
  },
  updatead: {
    type: adType.adType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
      title: {
        type: new GraphQLNonNull(GraphQLString),
      },
      body: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve: async (root, args) => {
      const UpdatedAd = await adModel.findByIdAndUpdate(args.id, args, {
        new: true,
      });
      if (!UpdatedAd) {
        throw new Error("Error");
      }
      return UpdatedAd;
    },
  },
  deletead: {
    type: adType.adType,
    args: {
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve: async (root, args, context) => {
      console.log(args, "args");
      const user = checkAuth(context);
      const adToRemove = await adModel.findByIdAndRemove(args.id);
      if (!adToRemove) {
        throw new Error(`Add with id: ${args.id} not found`);
      }

      try {
        if (user.username === adToRemove.username) {
          await adToRemove.delete();
          // return "ad deleted successfully";
          return {
            username: adToRemove.username,
            id: adToRemove._id,
            title: adToRemove.title,
          };
        } else {
          throw new Error("action not allowed");
        }
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  createComment: {
    type: adType.adType,
    args: {
      postId: {
        type: new GraphQLNonNull(GraphQLID),
      },
      body: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve: async (root, { postId, body }, context) => {
      console.log(postId, body, "postId, body");
      try {
        const { username } = checkAuth(context);

        if (body.trim() === "") {
          throw new Error("Comment body must not be empty");
        }

        const adToComment = await adModel.findById(postId);

        if (adToComment) {
          adToComment.comments.unshift({
            body,
            username,
            createdAt: new Date().toISOString(),
          });
          await adToComment.save();
          return adToComment;
        } else {
          throw new Error("Ad not found");
        }
      } catch (error) {
        throw new Error(error);
      }
    },
  },
  deleteComment: {
    type: adType.adType,
    args: {
      postId: {
        type: new GraphQLNonNull(GraphQLID),
      },
      commentId: {
        type: new GraphQLNonNull(GraphQLID),
      },
    },
    resolve: async (root, { postId, commentId }, context) => {
      console.log(args, "args");
      try {
        const { username } = checkAuth(context);

        const ad = await adModel.findById(postId);

        if (ad) {
          const commentIndex = ad.comments.findIndex((c) => c.id === commentId);
          if (ad.comments[commentIndex].username === username) {
            ad.comments.splice(commentIndex, 1);
            await ad.save();
            return ad;
          } else {
            throw new Error("action not allowed");
          }
        } else {
          throw new Error("ad / offer not found");
        }
      } catch (error) {
        throw new Error(error);
      }
    },
  },
};
