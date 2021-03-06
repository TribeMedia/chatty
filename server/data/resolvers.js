import GraphQLDate from 'graphql-date';
import { Group, Message, User } from './connectors';

export const Resolvers = {
  Date: GraphQLDate,

  Query: {
    group(_, args) {
      return Group.find({ where: args });
    },

    messages(_, args) {
      return Message.findAll({ where: args, order: [['createdAt', 'DESC']] });
    },

    user(_, args) {
      return User.findOne({ where: args });
    },
  },

  Mutation: {
    createMessage(_, { text, userId, groupId }) {
      return Message.create({
        userId,
        text,
        groupId,
      });
    },

    createGroup(_, { name, userIds, userId }) {
      return User.findOne({ where: { id: userId } })
        .then((user) => {
          return user.getFriends({ where: { id: { $in: userIds } } })
            .then((friends) => {
              return Group.create({
                name,
                users: [user, ...friends],
              }).then((group) => {
                return group.addUsers([user, ...friends]).then(() => {
                  return group;
                });
              });
            });
        });
    },

    deleteGroup(_, { id }) {
      return Group.find({ where: id })
        .then(group => group.getUsers()
          .then(users => group.removeUsers(users))
          .then(() => Message.destroy({ where: { groupId: group.id } }))
          .then(() => group.destroy()),
        );
    },

    leaveGroup(_, { id, userId }) {
      return Group.findOne({ where: { id } })
        .then((group) => {
          group.removeUser(userId);
          return { id };
        });
    },

    updateGroup(_, { id, name }) {
      return Group.findOne({ where: { id } })
        .then(group => group.update({ name }));
    },
  },

  Group: {
    users(group) {
      return group.getUsers();
    },
    messages(group) {
      return Message.findAll({
        where: { groupId: group.id },
        order: [['createdAt', 'DESC']],
      });
    },
  },

  Message: {
    to(message) {
      return message.getGroup();
    },
    from(message) {
      return message.getUser();
    },
  },

  User: {
    messages(user) {
      return Message.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
      });
    },
    groups(user) {
      return user.getGroups();
    },
    friends(user) {
      return user.getFriends();
    },
  },
};

export default Resolvers;
