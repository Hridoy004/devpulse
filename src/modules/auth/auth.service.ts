import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";
import { pool } from "../../db";
import type { IUser } from "./auth.interface";

const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [name, email, hashPassword, role],
  );

  delete result.rows[0].password;

  return result;
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credential!");
  }

  const user = userData.rows[0];

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }

  const jwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  const accessToken = jwt.sign(jwtpayload, config.secret as string, {
    expiresIn: "1d",
  });

  return { token: accessToken, user: jwtpayload };
};

export const authService = {
  createUserIntoDB,
  loginUserIntoDB,
};
