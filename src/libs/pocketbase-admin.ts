import PocketBase from "pocketbase";
const pbAdmin = new PocketBase(import.meta.env.PB_ENDPOINT);

pbAdmin.admins.authWithPassword(
  "test@test.com",
  "-5rftpCic8dFTSWFqDP0l2YOP7BzHzA4"
);

export default pbAdmin;
