import { getStaffById as loadStaff } from "./db";

export function passwordProblem(password) {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Include at least one letter and one number.";
  }
  return null;
}

export async function getStaffById(id) {
  return loadStaff(id);
}

export function mapStaffFromAuth(profile) {
  return profile;
}
