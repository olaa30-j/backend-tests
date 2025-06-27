import { Response, Request } from "express";  

interface CookieOptions {
  httpOnly: boolean;
  secure?: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
}

export const setCookie = (
  res: Response,
  name: string,
  value: string | undefined,
  options: Partial<CookieOptions> = {},
  req?: Request  
) => {
  const isProduction = process.env.NODE_ENV === "production";
  const isCapacitor = req?.headers?.origin?.startsWith("capacitor://");

  const defaultOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction || isCapacitor,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 90 * 24 * 60 * 60 * 1000,
    path: "/",
    domain: isProduction ? ".yourdomain.com" : undefined
  };

  res.cookie(name, value, { ...defaultOptions, ...options });
};

export const clearCookie = (
  res: Response,
  name: string,
  req?: Request  
) => {
  const isProduction = process.env.NODE_ENV === "production";
  const isCapacitor = req?.headers?.origin?.startsWith("capacitor://");

  res.clearCookie(name, {
    httpOnly: true,
    secure: isProduction || isCapacitor,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    domain: isProduction ? ".yourdomain.com" : undefined
  });
};