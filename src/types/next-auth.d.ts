import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: 'PLAYER' | 'ADMIN'
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: 'PLAYER' | 'ADMIN'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'PLAYER' | 'ADMIN'
  }
}
