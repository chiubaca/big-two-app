import PocketBase from "pocketbase";
import { PROD_URL } from "./config";
const pbClient = new PocketBase(import.meta.env.PUBLIC_PB_ENDPOINT || PROD_URL);

export default pbClient;
