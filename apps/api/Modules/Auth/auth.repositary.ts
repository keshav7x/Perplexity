import { usersTable } from "@api/Database/schema";
import { db } from "@api/Database";
import type z from "zod";
import { eq } from "drizzle-orm";


export class authRepoClass{
  private VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000
  private createTokenExpiry = (
    ttlMs = this.VERIFICATION_TOKEN_TTL_MS
  ): Date => {
    return new Date(Date.now() + ttlMs);
  };

  constructor(private readonly database = db) { }
   create = async (data: {
    name: string,
    age: number,
    email: string,
     password: string,
    tokenHash:string
  }) => {

     const expiresIn=this.createTokenExpiry()

    const [user] = await this.database.insert(usersTable).values({
      name: data.name,
      age: data.age,
      email: data.email,
      emailVerified: false,
      hashedPassword: data.password,
      tokenHash: data.tokenHash,
      token_expires_at:expiresIn
    }).returning()
    return user
  }

  findByVerificationToken = async (tokenHash: string) => {
    const [user] = await this.database
      .select()
      .from(usersTable)
      .where(eq(usersTable.tokenHash, tokenHash))
      .limit(1);

    return user;
  };

  updateVerficationToken = async (userId: number, token: string) => {
    const expiresIn=this.createTokenExpiry()
    const [user] = await this.database.update(usersTable).set({
      tokenHash: token,
      token_expires_at:expiresIn
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
    const [user]= await this.database.
      select().
      from(usersTable).
      where(eq(usersTable.email, data.email)).
      limit(1)
    return !!user
  }

  findUserById = async (userId: number) => {
    const [user] = await this.database.select().from(usersTable).where(eq(usersTable.id, userId))
    return user
  }




}
