import PocketBase from "pocketbase";
const pbClient = new PocketBase(import.meta.env.PB_ENDPOINT);

export default pbClient;
