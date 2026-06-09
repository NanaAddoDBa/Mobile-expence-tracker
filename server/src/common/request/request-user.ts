/**
 * Auth guards will attach this user shape to validated requests in a later backend phase.
 */
export interface RequestUser {
  id: string;
  email: string;
  name?: string;
}
