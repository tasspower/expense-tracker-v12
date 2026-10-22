import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// 🔹 ประกาศขยาย Type ของ NextAuth ให้รองรับ id และ role
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน")
        }

        const cleanEmail = credentials.email.toLowerCase().trim()
        const user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        })

        if (!user || !user.password) {
          throw new Error("ไม่พบผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง")
        }

        return {
          id: user.id,
          name: user.name || user.email.split("@")[0],
          email: user.email,
          role: user.role || "USER",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        token.role = dbUser?.role || "USER"
        token.name = dbUser?.name || user.name
      }
      if (trigger === "update" && session) {
        token.role = session.role || token.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || "USER"
        session.user.name = token.name as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      const categories = [
        { name: "🍔 อาหารและเครื่องดื่ม", type: "EXPENSE" },
        { name: "🚗 การเดินทาง", type: "EXPENSE" },
        { name: "🛍️ ช้อปปิ้ง", type: "EXPENSE" },
        { name: "💡 ค่าน้ำค่าไฟ", type: "EXPENSE" },
        { name: "🏠 ที่พักอาศัย", type: "EXPENSE" },
        { name: "🎬 บันเทิง", type: "EXPENSE" },
        { name: "💰 เงินเดือน", type: "INCOME" },
        { name: "💻 งานฟรีแลนซ์", type: "INCOME" },
        { name: "🎁 โบนัส/ของขวัญ", type: "INCOME" },
      ]

      for (const cat of categories) {
        await prisma.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            userId: user.id,
          },
        })
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "expense-tracker-secret-key-2026",
}