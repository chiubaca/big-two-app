import type { BigTwoGameMachineSnapshot } from "~libs/helpers/gameStateMachine";
import type { User } from "./User";

export type Room = {
  id: string;
  admin: string;
  collectionId: string;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
  players: string[];
  gameState: BigTwoGameMachineSnapshot;
  roomName: string;
};

export type ExpandedRoom = Room & {
  expand: {
    admin: User;
  };
};
