import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clearSessionPersistence } from "@/lib/auth-persistence";

let intentionalSignOut = false;

/** True when the current SIGNED_OUT event came from the user pressing Logout. */
export function wasIntentionalSignOut(): boolean {
  return intentionalSignOut;
}

export async function signOutIntentionally(queryClient: QueryClient): Promise<void> {
  intentionalSignOut = true;
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  clearSessionPersistence();
}

