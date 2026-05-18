import Hashids from 'hashids'
export const hashids = new Hashids(process.env.NEXT_PUBLIC_HASHIDS,6)