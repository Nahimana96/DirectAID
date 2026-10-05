import {drizzle} from 'drizzle-orm/libsql';
import {sqlClient} from '@/lib/database';
import * as schema from './schema';
export const getDb=()=>drizzle(sqlClient(),{schema});
