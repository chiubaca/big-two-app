import PocketBase from "pocketbase";
const pbClient = new PocketBase(import.meta.env.PUBLIC_PB_ENDPOINT);

export default pbClient;
