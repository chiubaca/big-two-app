import PocketBase from "pocketbase";
const pbAdmin = new PocketBase("http://127.0.0.1:8090");

pbAdmin.admins.authWithPassword(
  "test@test.com",
  "-5rftpCic8dFTSWFqDP0l2YOP7BzHzA4"
);

export default pbAdmin;
