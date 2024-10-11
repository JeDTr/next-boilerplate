import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt"
// import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      accessToken: string
      refreshToken: string
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    accessToken: string
    refreshToken: string
  }
}

const providers: Provider[] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "text" },
      password: { label: "Password", type: "password" }
    },
    authorize: async ({ email, password }) => {
      const res = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email, // 'emilys'
          password: password, // 'emilyspass'
          expiresInMins: 3600, // optional, defaults to 60
        }),
        credentials: 'include' // Include cookies (e.g., accessToken) in the request
      })

      const user = await res.json()
      console.log('authorized user',user)
      
      return {
        ...user,
        name: user.username,
      }
    },
  }),
  // GitHub,
]

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider()
      return { id: providerData.id, name: providerData.name }
    } else {
      return { id: provider.id, name: provider.name }
    }
  })
  .filter((provider) => provider.id !== "credentials")

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/signin"
  },
  callbacks: {
    jwt({ token, user }) {
      // console.log('jwt', token, user)
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }
      return token
    },
    session({ session, token }) {
      // console.log('session', session, token)
      session.user.accessToken = token.accessToken
      session.user.refreshToken = token.refreshToken
      return session
    },
  }
})