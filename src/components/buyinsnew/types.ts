// Types for BuyInsNew form

export type CustomerForm = {
  id: string;
  gender: "M" | "F" | "";
  firstNameHe: string;
  lastNameHe: string;
  firstNameEn: string;
  lastNameEn: string;
  birthDate: string;
  email: string;
  phone: string;
};

export type AdditionalCustomer = {
  personId: string;
  primaryName: string;
  firstNameHe: string;
  lastNameHe: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: "M" | "F" | "";
  birthDate: string;
  email: string;
  phone: string;
};

export type StatusType =
  | { type: "idle"; text: string }
  | { type: "checking"; text: string }
  | { type: "ok"; text: string }
  | { type: "notfound"; text: string }
  | { type: "error"; text: string };
