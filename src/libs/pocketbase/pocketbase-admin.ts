import PocketBase from "pocketbase";
import { PROD_URL } from "./config";
const pbAdmin = new PocketBase(import.meta.env.PUBLIC_PB_ENDPOINT || PROD_URL);

pbAdmin.admins.authWithPassword(
  "test@test.com",
  "-5rftpCic8dFTSWFqDP0l2YOP7BzHzA4"
);

export default pbAdmin;
