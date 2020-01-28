export default `
  type Message {
    id: Int!
    text: String!
    user: User!
    channel: Channel!
  }
  type Mutation {
      createMessage(channel_id: Int!, text: String!): Boolean!
  }
`;
