import { usersTable } from "@api/Database/schema";
import { db } from "@api/Database";
import type z from "zod";
import { eq } from "drizzle-orm";


export class authRepoClass{
  constructor(private readonly database = db) { }
   create = async (data: {
    name: string,
    age: number,
    email: string,
     password: string,
    tokenHash:string
  }) => {

    const [user] = await this.database.insert(usersTable).values({
      name: data.name,
      age: data.age,
      email: data.email,
      emailVerified: false,
      hashedPassword: data.password,
      tokenHash:data.tokenHash
    }).returning()
    return user
  }

  verifyEmail = async (data: {
    token: string,
    userId:string
  }) => {

  }

  userExist = async (data: {
    email:string
  }) => {
    const user= await this.database.
      select().
      from(usersTable).
      where(eq(usersTable.email,data.email))
    if (user) return true
    return false
  }




}
