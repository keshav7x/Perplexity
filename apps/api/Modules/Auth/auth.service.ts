import { ApiResponse } from "@api/shared/Response";
import { authRepoClass } from "./auth.repositary";
import { email } from "zod";


export class authServiceClass{
  constructor(private readonly authRepo = new authRepoClass) { }

  create = async (data:{
      name: string,
      age: number,
      email: string,
      password:string
  }) => {
    if (!data.name) throw new Error("Name is required")
    if (!data.email) throw new Error("Email is required")
    if (!data.password) throw new Error("password is required")
    const userExist = await this.authRepo.userExist({
      email:data.email
    })
    if (userExist) return new Error("User Already Exist exist")

    const hashPassword=
    
  }
}
