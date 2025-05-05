import api from "./api";
import { AxiosError } from "axios";
import { Event } from "../types";

export const getEvents = async (categoryId: string): Promise<Event[]> => {
  try {
    const response = await api.get(`/events/category/${categoryId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred");
  }
};

export const getEventById = async (eventId: string): Promise<Event> => {
  try {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred");
  }
};
export const getAllEvents = async (): Promise<Event[]> => {
    try {
        const response = await api.get("/events");
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
        throw new Error(error.message);
        }
        throw new Error("An unexpected error occurred");
    }
}
export const createEvent = async (eventData: Event): Promise<Event> => {
  try {
    console.log("Event data to be sent:", eventData);
    const response = await api.post("/events", eventData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred");
  }
}


export const resolveEvent = async (eventId: string, winningOutcome: string): Promise<Event> => {
    try {
        const response = await api.post(`/events/${eventId}/resolve`, { winningOutcome });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
        throw new Error(error.message);
        }
        throw new Error("An unexpected error occurred");
    }
    };