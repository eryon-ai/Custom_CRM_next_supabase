// ============================================================
// Typed Database Helper — avoids `as any` everywhere
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function typedDb(supabase: SupabaseClient<Database>) {
  return {
    from: <T extends keyof Database['public']['Tables']>(table: T) => {
      const qb = supabase.from(table);
      return {
        select: (...args: Parameters<typeof qb.select>) =>
          qb.select(...args) as ReturnType<typeof qb.select>,
        insert: (...args: Parameters<typeof qb.insert>) =>
          qb.insert(...args) as ReturnType<typeof qb.insert>,
        update: (...args: Parameters<typeof qb.update>) =>
          qb.update(...args) as ReturnType<typeof qb.update>,
        delete: (...args: Parameters<typeof qb.delete>) =>
          qb.delete(...args) as ReturnType<typeof qb.delete>,
      };
    },
  };
}
