import argon2 from 'argon2'
import generateUniqueId  from "generate-unique-id"
export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password)
}

export const generateVerificationId = () => {
  return generateUniqueId()
}

