import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {
          type: "email",
          label: "E-mail",
          placeholder: "exemplo@gmail.com",
        },
        password: {
          type: "password",
          label: "Senha",
          placeholder: "*****",
        },
      },
      authorize: async (credentials) => {
        return null;
      }
    })
  ],
});

