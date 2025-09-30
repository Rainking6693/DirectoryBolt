type BcryptjsModule = typeof import('../node_modules/@types/bcryptjs/index')
type JsonWebTokenModule = typeof import('../node_modules/@types/jsonwebtoken/index')

declare module 'bcryptjs' {
  const bcrypt: BcryptjsModule
  export = bcrypt
}

declare module 'jsonwebtoken' {
  const jsonwebtoken: JsonWebTokenModule
  export = jsonwebtoken
}

declare module 'formidable' {
  const formidable: any
  export default formidable
}
