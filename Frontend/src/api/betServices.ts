import api from "./api";
import { AxiosError } from "axios";
import { Bet } from "../types";

/**
 * Fetches all bets placed by a specific user.
 *
 * @param userId - The ID of the user whose bets are being fetched.
 * @returns A promise that resolves to an array of Bet objects.
 * @throws Will throw an error if the request fails.
 */
export const getUserBets = async (userId: string): Promise<Bet[]> => {
  try {
    const response = await api.get(`/bets/user/${userId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred");
  }
};

/**
 * Retrieves all bets associated with a specific event.
 *
 * @param eventId - The ID of the event to get bets for.
 * @returns A promise that resolves to an array of Bet objects.
 * @throws Will throw an error if the request fails.
 */
export const getBetsByEventId = async (eventId: string): Promise<Bet[]> => {
  try {
    const response = await api.get(`/bets/${eventId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred");
  }
};



/**
 * Places a new bet for a specific user on a given event outcome.
 *
 * @param eventId - The ID of the event being bet on.
 * @param outcomeId - The ID of the selected outcome.
 * @param amount - The amount of the bet.
 * @param userId - The ID of the user placing the bet.
 * @returns A promise that resolves to the created Bet object.
 * @throws Will throw an error if the request fails.
 */
export const placeBet = async ({
  eventId,
  outcomeId,
  amount,
  user,
}: Bet): Promise<Bet> => {
  try {
    const response = await api.post("/bets", {
      user,
      eventId: parseInt(eventId,10),
      outcomeId: outcomeId,
      amount,
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      throw new Error(error.response.data?.error || error.message);
    }
    throw new Error("An unexpected error occurred");
  }
};
/**
 * Claims the reward for a winning bet.
 *
 * @param betId - The ID of the bet to claim the reward for.
 * @returns A promise that resolves to the updated Bet object after claiming.
 * @throws Will throw an error if the request fails.
 */
export const claimReward = async (betId: number): Promise<Bet> => {
  try {
    const response = await api.post(`/bets/${betId}/claim`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred");
  }
};
