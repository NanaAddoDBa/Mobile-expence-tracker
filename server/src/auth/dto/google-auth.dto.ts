import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  credential!: string;
}
