export default `

  type Channel {
    id: Int!
    name: String!
    public: Boolean!
    messages: [Message!]!
    users: [User!]!
  }

  type Message {
    id: Int!
    text: String!
    user: User!
    channel: Channel!
  }

  type Team {
    owner: User!
    members: [User!]!
    channels: [Channel!]!
  }

  type User {
    id: Int!
    username: String!
    email: String!
    teams: [Team]!
  }

  type Query {
      hi: String
  }
`;
