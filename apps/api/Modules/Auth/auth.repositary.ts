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

  findByVerificationToken = async (token: string) => {
    const [user] = await this.database.
      select().
      from(usersTable).
      where(eq(usersTable.tokenHash,token))
    return user
  }

  updateVerficationToken = async (userId: number,token:string) => {
    const [user] = await this.database.update(usersTable).set({
      tokenHash:token
    }).where(eq(usersTable.id, userId)).returning()
    return user

  }

  markAsVerified = async(userId: number) => {
    const [user] = await this.database.update(usersTable).set({
      'emailVerified':true
    }).where(eq(usersTable.id, userId)).returning()
    return user

  }

  findByEmail = async (email: string) => {
    const [user] = await this.database.select().from(usersTable).where(eq(usersTable.email, email))
    return user
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

  findUserById = async (userId: number) => {
    const [user] = await this.database.select().from(usersTable).where(eq(usersTable.id, userId))
    return user
  }




}
