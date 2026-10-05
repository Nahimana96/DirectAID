import {pbkdf2 as derive,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const pbkdf2=promisify(derive);
const iterations=600000;
/** @param {string} password */
export async function passwordHash(password){const salt=randomBytes(16).toString('hex');const key=await pbkdf2(password,salt,iterations,32,'sha256');return `pbkdf2-sha256$${iterations}$${salt}$${key.toString('hex')}`;}
/** @param {string} password @param {string} stored */
export async function passwordMatches(password,stored){const [version,count,salt,value]=stored.split('$');if(version!=='pbkdf2-sha256'||count!=='600000'||!/^\w{32}$/.test(salt??'')||!/^\w{64}$/.test(value??''))return false;const key=await pbkdf2(password,salt,iterations,32,'sha256');return timingSafeEqual(key,Buffer.from(value,'hex'));}
