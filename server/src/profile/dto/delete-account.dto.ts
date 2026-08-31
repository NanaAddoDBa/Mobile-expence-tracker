import { Equals } from "class-validator";

export class DeleteAccountDto {
  @Equals("DELETE")
  confirmation!: "DELETE";
}
